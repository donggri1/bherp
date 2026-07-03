import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { CertificateType } from '../../modules/certificate-types/entities/certificate-type.entity';
import { EmployeeCertificate } from '../../modules/employee-certificates/entities/employee-certificate.entity';
import { Employee } from '../../modules/employees/entities/employee.entity';
import { SequencesService } from '../../modules/sequences/sequences.service';
import {
  DEFAULT_DISTRIBUTION_WORKFORCE_BATCH_LIMIT,
  DEFAULT_DISTRIBUTION_WORKFORCE_REQUEST_DELAY_MS,
  DISTRIBUTION_WORKFORCE_BASE_CERTIFICATE_NAME,
  DISTRIBUTION_WORKFORCE_TARGET_NAMES,
  DISTRIBUTION_WORKFORCE_TARGETS,
} from './constants/distribution-workforce.constants';
import { BulkDistributionWorkforceDto } from './dto/bulk-distribution-workforce.dto';
import { DistributionWorkforceQueryDto } from './dto/distribution-workforce-query.dto';
import { FetchDistributionWorkforceDto } from './dto/fetch-distribution-workforce.dto';
import { DistributionWorkforceCertificate } from './entities/distribution-workforce-certificate.entity';
import {
  DistributionWorkforceKepcoClient,
  KepcoDistributionQualification,
} from './distribution-workforce-kepco.client';

type DistributionWorkforceProcessItem = {
  employeeId: number;
  employeeName?: string;
  status: string;
  message: string;
  qualifications?: Array<{
    qualificationName: string;
    certificateNo?: string | null;
    qualificationStatus?: string | null;
  }>;
};

type DistributionWorkforceEmployeeStatus = {
  id: number;
  employeeCode: string;
  employeeName: string;
  departmentName?: string | null;
  positionName?: string | null;
  phone?: string | null;
  hasBaseCertificate: boolean;
  hasBaseCertificateNo: boolean;
  baseCertificateNoMasked?: string | null;
  birthDateAvailable: boolean;
  birthDateSource?: 'residentRegistrationNumber';
  noOutageStatus?: string | null;
  noOutageLastFetchedAt?: Date | null;
  undergroundStatus?: string | null;
  undergroundLastFetchedAt?: Date | null;
  lastFetchedAt?: Date | null;
};

@Injectable()
export class DistributionWorkforceService {
  private readonly logger = new Logger(DistributionWorkforceService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(CertificateType)
    private readonly certificateTypeRepository: Repository<CertificateType>,
    @InjectRepository(EmployeeCertificate)
    private readonly employeeCertificateRepository: Repository<EmployeeCertificate>,
    @InjectRepository(DistributionWorkforceCertificate)
    private readonly distributionCertificateRepository: Repository<DistributionWorkforceCertificate>,
    private readonly sequencesService: SequencesService,
    private readonly configService: ConfigService,
    private readonly kepcoClient: DistributionWorkforceKepcoClient,
  ) {}

  async findEmployees(companyId: number, query: DistributionWorkforceQueryDto) {
    const employees = await this.findEmployeeCandidates(companyId, query);
    const enriched = await this.enrichEmployees(companyId, employees);
    const filtered = enriched.filter((item) => {
      if (
        query.hasBaseCertificate !== undefined &&
        item.hasBaseCertificate !== query.hasBaseCertificate
      ) {
        return false;
      }
      if (
        query.hasBaseCertificateNo !== undefined &&
        item.hasBaseCertificateNo !== query.hasBaseCertificateNo
      ) {
        return false;
      }
      return true;
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return {
      items: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length,
      page,
      limit,
    };
  }

  async registerBaseCertificate(
    companyId: number,
    dto: BulkDistributionWorkforceDto,
  ) {
    this.validateBatchSize(dto.employeeIds);
    const certificateType = await this.ensureCertificateType(
      companyId,
      DISTRIBUTION_WORKFORCE_BASE_CERTIFICATE_NAME,
    );
    const employees = await this.employeeRepository.find({
      where: { companyId, id: In(dto.employeeIds) },
    });
    const employeeMap = new Map(employees.map((item) => [item.id, item]));
    const existing = await this.employeeCertificateRepository.find({
      where: {
        companyId,
        employeeId: In(dto.employeeIds),
        certificateTypeId: certificateType.id,
      },
    });
    const existingEmployeeIds = new Set(
      existing.map((item) => item.employeeId),
    );

    let created = 0;
    let skipped = 0;
    let failed = 0;
    const items: DistributionWorkforceProcessItem[] = [];

    for (const employeeId of dto.employeeIds) {
      const employee = employeeMap.get(employeeId);
      if (!employee) {
        failed += 1;
        items.push({
          employeeId,
          status: 'failed',
          message: '사원을 찾을 수 없습니다.',
        });
        continue;
      }

      if (existingEmployeeIds.has(employeeId)) {
        skipped += 1;
        items.push({
          employeeId,
          employeeName: employee.employeeName,
          status: 'skipped',
          message: '이미 등록됨',
        });
        continue;
      }

      await this.employeeCertificateRepository.save(
        this.employeeCertificateRepository.create({
          companyId,
          employeeId,
          certificateTypeId: certificateType.id,
          isActive: true,
        }),
      );
      created += 1;
      items.push({
        employeeId,
        employeeName: employee.employeeName,
        status: 'created',
        message: '등록됨',
      });
    }

    return { created, skipped, failed, items };
  }

  async fetchAndUpsert(companyId: number, dto: FetchDistributionWorkforceDto) {
    this.validateBatchSize(dto.employeeIds);
    this.validateDateRange(dto.periodFrom, dto.periodTo);
    if (dto.periodFrom > dto.periodTo) {
      throw new BadRequestException(
        '조회기간 시작일은 종료일보다 늦을 수 없습니다.',
      );
    }

    const baseCertificateType = await this.ensureCertificateType(
      companyId,
      DISTRIBUTION_WORKFORCE_BASE_CERTIFICATE_NAME,
    );
    await this.ensureTargetCertificateTypes(companyId);

    let success = 0;
    let failed = 0;
    const items: DistributionWorkforceProcessItem[] = [];

    for (const employeeId of dto.employeeIds) {
      const result = await this.fetchAndUpsertOne(
        companyId,
        employeeId,
        baseCertificateType,
        dto,
      );
      if (result.status === 'success') success += 1;
      else failed += 1;
      items.push(result);
      await this.delay(this.requestDelayMs());
    }

    return { success, failed, items };
  }

  private async findEmployeeCandidates(
    companyId: number,
    query: DistributionWorkforceQueryDto,
  ) {
    const builder = this.employeeRepository
      .createQueryBuilder('employee')
      .where('employee.companyId = :companyId', { companyId });

    if (query.isActive !== undefined) {
      builder.andWhere('employee.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    const keyword = query.keyword?.trim();
    if (keyword) {
      builder.andWhere(
        new Brackets((qb) => {
          qb.where('employee.employeeCode LIKE :keyword', {
            keyword: `%${keyword}%`,
          })
            .orWhere('employee.employeeName LIKE :keyword', {
              keyword: `%${keyword}%`,
            })
            .orWhere('employee.departmentName LIKE :keyword', {
              keyword: `%${keyword}%`,
            });
        }),
      );
    }

    const departmentName = query.departmentName?.trim();
    if (departmentName) {
      builder.andWhere('employee.departmentName LIKE :departmentName', {
        departmentName: `%${departmentName}%`,
      });
    }

    return builder.orderBy('employee.id', 'DESC').getMany();
  }

  private async enrichEmployees(
    companyId: number,
    employees: Employee[],
  ): Promise<DistributionWorkforceEmployeeStatus[]> {
    if (!employees.length) return [];

    const employeeIds = employees.map((item) => item.id);
    const certificateTypes = await this.certificateTypeRepository.find({
      where: {
        companyId,
        certificateTypeName: In([
          DISTRIBUTION_WORKFORCE_BASE_CERTIFICATE_NAME,
          ...DISTRIBUTION_WORKFORCE_TARGET_NAMES,
        ]),
      },
    });
    const certificateTypeByName = new Map(
      certificateTypes.map((item) => [item.certificateTypeName, item]),
    );
    const relatedTypeIds = certificateTypes.map((item) => item.id);
    const employeeCertificates = relatedTypeIds.length
      ? await this.employeeCertificateRepository.find({
          where: {
            companyId,
            employeeId: In(employeeIds),
            certificateTypeId: In(relatedTypeIds),
          },
        })
      : [];
    const distributionCertificates =
      await this.distributionCertificateRepository.find({
        where: {
          companyId,
          employeeId: In(employeeIds),
          qualificationName: In([...DISTRIBUTION_WORKFORCE_TARGET_NAMES]),
        },
      });

    const baseType = certificateTypeByName.get(
      DISTRIBUTION_WORKFORCE_BASE_CERTIFICATE_NAME,
    );
    const baseCertificateByEmployeeId = new Map<number, EmployeeCertificate>();
    if (baseType) {
      for (const certificate of employeeCertificates) {
        if (certificate.certificateTypeId === baseType.id) {
          baseCertificateByEmployeeId.set(certificate.employeeId, certificate);
        }
      }
    }

    const distributionByEmployeeAndName = new Map<
      string,
      DistributionWorkforceCertificate
    >();
    for (const certificate of distributionCertificates) {
      distributionByEmployeeAndName.set(
        `${certificate.employeeId}:${certificate.qualificationName}`,
        certificate,
      );
    }

    return employees.map((employee) => {
      const baseCertificate = baseCertificateByEmployeeId.get(employee.id);
      const birthDate = this.birthDateFromResidentRegistrationNumber(
        employee.residentRegistrationNumber,
      );
      const noOutage = distributionByEmployeeAndName.get(
        `${employee.id}:${DISTRIBUTION_WORKFORCE_TARGETS.noOutage}`,
      );
      const underground = distributionByEmployeeAndName.get(
        `${employee.id}:${DISTRIBUTION_WORKFORCE_TARGETS.underground}`,
      );

      return {
        id: employee.id,
        employeeCode: employee.employeeCode,
        employeeName: employee.employeeName,
        departmentName: employee.departmentName,
        positionName: employee.positionName,
        phone: employee.phone,
        hasBaseCertificate: Boolean(baseCertificate),
        hasBaseCertificateNo: Boolean(baseCertificate?.certificateNo?.trim()),
        baseCertificateNoMasked: this.maskCertificateNo(
          baseCertificate?.certificateNo,
        ),
        birthDateAvailable: Boolean(birthDate),
        birthDateSource: birthDate ? 'residentRegistrationNumber' : undefined,
        noOutageStatus:
          noOutage?.lastFetchStatus ?? noOutage?.qualificationStatus,
        noOutageLastFetchedAt: noOutage?.lastFetchedAt,
        undergroundStatus:
          underground?.lastFetchStatus ?? underground?.qualificationStatus,
        undergroundLastFetchedAt: underground?.lastFetchedAt,
        lastFetchedAt: this.latestDate([
          noOutage?.lastFetchedAt,
          underground?.lastFetchedAt,
        ]),
      };
    });
  }

  private async fetchAndUpsertOne(
    companyId: number,
    employeeId: number,
    baseCertificateType: CertificateType,
    dto: FetchDistributionWorkforceDto,
  ) {
    const employee = await this.employeeRepository.findOne({
      where: { companyId, id: employeeId },
    });
    if (!employee) {
      return {
        employeeId,
        status: 'failed',
        message: '사원을 찾을 수 없습니다.',
      };
    }

    const baseCertificate = await this.employeeCertificateRepository.findOne({
      where: {
        companyId,
        employeeId,
        certificateTypeId: baseCertificateType.id,
      },
    });
    if (!baseCertificate?.certificateNo?.trim()) {
      return {
        employeeId,
        employeeName: employee.employeeName,
        status: 'failed',
        message: '배전기능자격 자격번호가 없습니다.',
      };
    }

    const birthDate = this.birthDateFromResidentRegistrationNumber(
      employee.residentRegistrationNumber,
    );
    if (!birthDate) {
      return {
        employeeId,
        employeeName: employee.employeeName,
        status: 'failed',
        message: '생년월일을 계산할 주민등록번호가 없습니다.',
      };
    }

    try {
      const certificateNoForKepco = this.normalizeCertificateNoForKepco(
        baseCertificate.certificateNo,
      );
      const response = await this.kepcoClient.fetchQualifications({
        employeeName: employee.employeeName,
        birthDate: this.compactDateForKepco(birthDate),
        certificateNo: certificateNoForKepco,
        periodFrom: dto.periodFrom,
        periodTo: dto.periodTo,
      });
      const upserted = await this.upsertTargetQualifications(
        companyId,
        employee,
        response.qualifications,
        dto.periodFrom,
        dto.periodTo,
      );
      if (!upserted.length) {
        return {
          employeeId,
          employeeName: employee.employeeName,
          status: 'failed',
          message: '조회 결과에 무정전/지중배전 자격이 없습니다.',
        };
      }
      return {
        employeeId,
        employeeName: employee.employeeName,
        status: 'success',
        message: '등록 및 갱신 완료',
        qualifications: upserted,
      };
    } catch (error) {
      return {
        employeeId,
        employeeName: employee.employeeName,
        status: 'failed',
        message:
          error instanceof Error ? error.message : 'KEPCO 조회에 실패했습니다.',
      };
    }
  }

  private async upsertTargetQualifications(
    companyId: number,
    employee: Employee,
    qualifications: KepcoDistributionQualification[],
    periodFrom: string,
    periodTo: string,
  ) {
    const targetNames = new Set<string>(DISTRIBUTION_WORKFORCE_TARGET_NAMES);
    const targetQualifications = qualifications.filter((item) =>
      targetNames.has(item.qualificationName),
    );
    this.logger.log(
      `KEPCO distribution target qualifications for employeeId=${employee.id}: ${JSON.stringify(
        targetQualifications.map((item) => ({
          qualificationName: item.qualificationName,
          acquiredDate: item.acquiredDate,
          renewedDate: item.renewedDate,
          expiredDate: item.expiredDate,
          qualificationStatus: item.qualificationStatus,
          certificateNo: item.certificateNo,
          workHours: item.workHours,
          memo: item.memo,
        })),
      )}`,
    );
    const targetTypes = await this.ensureTargetCertificateTypes(companyId);
    const targetTypeByName = new Map(
      targetTypes.map((item) => [item.certificateTypeName, item]),
    );
    const upserted: Array<{
      qualificationName: string;
      certificateNo?: string | null;
      qualificationStatus?: string | null;
    }> = [];

    for (const qualification of targetQualifications) {
      const certificateType = targetTypeByName.get(
        qualification.qualificationName,
      );
      if (!certificateType) continue;

      const employeeCertificates =
        await this.employeeCertificateRepository.find({
          where: {
            companyId,
            employeeId: employee.id,
            certificateTypeId: certificateType.id,
          },
          order: { id: 'DESC' },
        });
      let employeeCertificate = employeeCertificates[0];
      if (employeeCertificates.length > 1) {
        this.logger.warn(
          `Duplicate employee_certificates found for employeeId=${employee.id}, certificateTypeId=${certificateType.id}; updating ${employeeCertificates.length} rows`,
        );
      }
      const existingEmployeeValues = {
        certificateNo: this.firstPresent(
          employeeCertificates.map((item) => item.certificateNo),
        ),
        acquiredDate: this.firstPresent(
          employeeCertificates.map((item) => item.acquiredDate),
        ),
        renewedDate: this.firstPresent(
          employeeCertificates.map((item) => item.renewedDate),
        ),
        expiredDate: this.firstPresent(
          employeeCertificates.map((item) => item.expiredDate),
        ),
        qualificationStatus: this.firstPresent(
          employeeCertificates.map((item) => item.qualificationStatus),
        ),
        workHours: this.firstPresent(
          employeeCertificates.map((item) => item.workHours),
        ),
        memo: this.firstPresent(employeeCertificates.map((item) => item.memo)),
      };
      const certificatePayload = {
        companyId,
        employeeId: employee.id,
        certificateTypeId: certificateType.id,
        certificateNo:
          qualification.certificateNo ?? existingEmployeeValues.certificateNo,
        acquiredDate:
          qualification.acquiredDate ?? existingEmployeeValues.acquiredDate,
        renewedDate:
          qualification.renewedDate ?? existingEmployeeValues.renewedDate,
        expiredDate:
          qualification.expiredDate ?? existingEmployeeValues.expiredDate,
        qualificationStatus:
          qualification.qualificationStatus ??
          existingEmployeeValues.qualificationStatus,
        workHours: qualification.workHours ?? existingEmployeeValues.workHours,
        memo: qualification.memo ?? existingEmployeeValues.memo,
        isActive: true,
      };
      if (employeeCertificate) {
        await this.employeeCertificateRepository.update(
          {
            companyId,
            employeeId: employee.id,
            certificateTypeId: certificateType.id,
          },
          certificatePayload,
        );
        employeeCertificate = { ...employeeCertificate, ...certificatePayload };
      } else {
        employeeCertificate = await this.employeeCertificateRepository.save(
          this.employeeCertificateRepository.create(certificatePayload),
        );
      }

      const distributionCertificates =
        await this.distributionCertificateRepository.find({
          where: {
            companyId,
            employeeId: employee.id,
            qualificationName: qualification.qualificationName,
          },
          order: { id: 'DESC' },
        });
      let distributionCertificate = distributionCertificates[0];
      if (distributionCertificates.length > 1) {
        this.logger.warn(
          `Duplicate distribution_workforce_certificates found for employeeId=${employee.id}, qualificationName=${qualification.qualificationName}; updating ${distributionCertificates.length} rows`,
        );
      }
      const existingDistributionValues = {
        certificateNo: this.firstPresent(
          distributionCertificates.map((item) => item.certificateNo),
        ),
        acquiredDate: this.firstPresent(
          distributionCertificates.map((item) => item.acquiredDate),
        ),
        renewedDate: this.firstPresent(
          distributionCertificates.map((item) => item.renewedDate),
        ),
        expiredDate: this.firstPresent(
          distributionCertificates.map((item) => item.expiredDate),
        ),
        qualificationStatus: this.firstPresent(
          distributionCertificates.map((item) => item.qualificationStatus),
        ),
        workHours: this.firstPresent(
          distributionCertificates.map((item) => item.workHours),
        ),
        lastFetchMessage: this.firstPresent(
          distributionCertificates.map((item) => item.lastFetchMessage),
        ),
      };
      const distributionPayload = {
        companyId,
        employeeId: employee.id,
        employeeCertificateId: employeeCertificate.id,
        qualificationName: qualification.qualificationName,
        acquiredDate:
          qualification.acquiredDate ?? existingDistributionValues.acquiredDate,
        renewedDate:
          qualification.renewedDate ?? existingDistributionValues.renewedDate,
        expiredDate:
          qualification.expiredDate ?? existingDistributionValues.expiredDate,
        qualificationStatus:
          qualification.qualificationStatus ??
          existingDistributionValues.qualificationStatus,
        certificateNo:
          qualification.certificateNo ??
          existingDistributionValues.certificateNo,
        workHours:
          qualification.workHours ?? existingDistributionValues.workHours,
        workPeriodFrom: periodFrom,
        workPeriodTo: periodTo,
        lastFetchedAt: new Date(),
        lastFetchStatus: 'SUCCESS',
        lastFetchMessage:
          qualification.memo ??
          existingDistributionValues.lastFetchMessage ??
          '조회 성공',
      };
      if (distributionCertificate) {
        await this.distributionCertificateRepository.update(
          {
            companyId,
            employeeId: employee.id,
            qualificationName: qualification.qualificationName,
          },
          distributionPayload,
        );
        distributionCertificate = {
          ...distributionCertificate,
          ...distributionPayload,
        };
      } else {
        distributionCertificate =
          await this.distributionCertificateRepository.save(
            this.distributionCertificateRepository.create(distributionPayload),
          );
      }

      upserted.push({
        qualificationName: distributionCertificate.qualificationName,
        certificateNo: distributionCertificate.certificateNo,
        qualificationStatus: distributionCertificate.qualificationStatus,
      });
    }

    return upserted;
  }

  private async ensureTargetCertificateTypes(companyId: number) {
    const items: CertificateType[] = [];
    for (const name of DISTRIBUTION_WORKFORCE_TARGET_NAMES) {
      items.push(await this.ensureCertificateType(companyId, name));
    }
    return items;
  }

  private async ensureCertificateType(
    companyId: number,
    certificateTypeName: string,
  ) {
    const existing = await this.certificateTypeRepository.findOne({
      where: { companyId, certificateTypeName },
    });
    if (existing) return existing;

    return this.certificateTypeRepository.save(
      this.certificateTypeRepository.create({
        companyId,
        certificateTypeCode: await this.sequencesService.issue(
          companyId,
          'CERTIFICATE_TYPE',
        ),
        certificateTypeName,
        issuer: '한국전력공사',
        isActive: true,
        sortOrder: 0,
      }),
    );
  }

  private validateBatchSize(employeeIds: number[]) {
    const uniqueIds = new Set(employeeIds);
    if (uniqueIds.size !== employeeIds.length) {
      throw new BadRequestException('중복된 사원이 포함되어 있습니다.');
    }
    const limit = this.batchLimit();
    if (employeeIds.length > limit) {
      throw new BadRequestException(
        `한 번에 최대 ${limit}명까지 처리할 수 있습니다.`,
      );
    }
  }

  private validateDateRange(periodFrom: string, periodTo: string) {
    if (!this.isValidDate(periodFrom) || !this.isValidDate(periodTo)) {
      throw new BadRequestException('조회기간 날짜가 올바르지 않습니다.');
    }
  }

  private isValidDate(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  private normalizeCertificateNoForKepco(value: string) {
    return value.replace(/\D/g, '');
  }

  private compactDateForKepco(value: string) {
    return value.replace(/\D/g, '');
  }

  private batchLimit() {
    return this.configService.get<number>(
      'DISTRIBUTION_WORKFORCE_BATCH_LIMIT',
      DEFAULT_DISTRIBUTION_WORKFORCE_BATCH_LIMIT,
    );
  }

  private requestDelayMs() {
    return this.configService.get<number>(
      'DISTRIBUTION_WORKFORCE_REQUEST_DELAY_MS',
      DEFAULT_DISTRIBUTION_WORKFORCE_REQUEST_DELAY_MS,
    );
  }

  private birthDateFromResidentRegistrationNumber(value?: string | null) {
    const digits = value?.replace(/\D/g, '');
    if (!digits || digits.length < 7) return null;

    const year = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    const day = Number(digits.slice(4, 6));
    const centuryCode = digits[6];
    const century =
      centuryCode === '1' ||
      centuryCode === '2' ||
      centuryCode === '5' ||
      centuryCode === '6'
        ? 1900
        : centuryCode === '3' ||
            centuryCode === '4' ||
            centuryCode === '7' ||
            centuryCode === '8'
          ? 2000
          : centuryCode === '9' || centuryCode === '0'
            ? 1800
            : null;
    if (!century) return null;

    const date = new Date(Date.UTC(century + year, month - 1, day));
    if (
      date.getUTCFullYear() !== century + year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    return `${date.getUTCFullYear()}-${String(month).padStart(2, '0')}-${String(
      day,
    ).padStart(2, '0')}`;
  }

  private maskCertificateNo(value?: string | null) {
    const normalized = value?.trim();
    if (!normalized) return null;
    if (normalized.length <= 4) return '*'.repeat(normalized.length);
    return `${normalized.slice(0, 2)}${'*'.repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-2)}`;
  }

  private latestDate(values: Array<Date | null | undefined>) {
    return values
      .filter((value): value is Date => Boolean(value))
      .sort((left, right) => right.getTime() - left.getTime())[0];
  }

  private firstPresent<T>(values: Array<T | null | undefined>) {
    return (
      values.find(
        (value) => value !== null && value !== undefined && value !== '',
      ) ?? null
    );
  }

  private delay(ms: number) {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
