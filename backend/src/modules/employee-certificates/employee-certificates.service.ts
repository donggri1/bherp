import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeCertificateDto } from './dto/create-employee-certificate.dto';
import { EmployeeCertificateQueryDto } from './dto/employee-certificate-query.dto';
import { UpdateEmployeeCertificateDto } from './dto/update-employee-certificate.dto';
import { EmployeeCertificate } from './entities/employee-certificate.entity';

@Injectable()
export class EmployeeCertificatesService {
  private readonly logger = new Logger(EmployeeCertificatesService.name);

  constructor(
    @InjectRepository(EmployeeCertificate)
    private readonly repository: Repository<EmployeeCertificate>,
  ) {}

  async findAll(companyId: number, query: EmployeeCertificateQueryDto) {
    const builder = this.repository
      .createQueryBuilder('employeeCertificate')
      .where('employeeCertificate.companyId = :companyId', { companyId });

    if (query.employeeId) {
      builder.andWhere('employeeCertificate.employeeId = :employeeId', {
        employeeId: query.employeeId,
      });
    }

    const certificateTypeIds = query.certificateTypeIds?.length
      ? query.certificateTypeIds
      : query.certificateTypeId
        ? [query.certificateTypeId]
        : [];

    if (certificateTypeIds.length) {
      builder.andWhere(
        'employeeCertificate.certificateTypeId IN (:...certificateTypeIds)',
        {
          certificateTypeIds,
        },
      );
    }

    if (query.isActive !== undefined) {
      builder.andWhere('employeeCertificate.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    if (query.expiredDateFrom) {
      builder.andWhere('employeeCertificate.expiredDate >= :expiredDateFrom', {
        expiredDateFrom: query.expiredDateFrom,
      });
    }

    if (query.expiredDateTo) {
      builder.andWhere('employeeCertificate.expiredDate <= :expiredDateTo', {
        expiredDateTo: query.expiredDateTo,
      });
    }

    const [items, total] = await builder
      .orderBy('employeeCertificate.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(companyId: number, id: number) {
    const item = await this.repository.findOne({ where: { id, companyId } });
    if (!item)
      throw new NotFoundException('사원 자격증 정보를 찾을 수 없습니다.');
    return item;
  }

  async create(companyId: number, dto: CreateEmployeeCertificateDto) {
    const criteria = {
      companyId,
      employeeId: dto.employeeId,
      certificateTypeId: dto.certificateTypeId,
    };
    const existingItems = await this.repository.find({
      where: criteria,
      order: { id: 'DESC' },
    });

    if (!existingItems.length) {
      return this.repository.save(
        this.repository.create({ ...dto, companyId }),
      );
    }

    if (existingItems.length > 1) {
      this.logger.warn(
        `Duplicate employee_certificates found for employeeId=${dto.employeeId}, certificateTypeId=${dto.certificateTypeId}; updating ${existingItems.length} rows`,
      );
    }

    const payload = {
      companyId,
      employeeId: dto.employeeId,
      certificateTypeId: dto.certificateTypeId,
      certificateNo: this.nextValue(
        dto.certificateNo,
        existingItems.map((item) => item.certificateNo),
      ),
      issuer: this.nextValue(
        dto.issuer,
        existingItems.map((item) => item.issuer),
      ),
      acquiredDate: this.nextValue(
        dto.acquiredDate,
        existingItems.map((item) => item.acquiredDate),
      ),
      renewedDate: this.nextValue(
        dto.renewedDate,
        existingItems.map((item) => item.renewedDate),
      ),
      expiredDate: this.nextValue(
        dto.expiredDate,
        existingItems.map((item) => item.expiredDate),
      ),
      qualificationStatus: this.nextValue(
        dto.qualificationStatus,
        existingItems.map((item) => item.qualificationStatus),
      ),
      workHours: this.nextValue(
        dto.workHours,
        existingItems.map((item) => item.workHours),
      ),
      memo: this.nextValue(
        dto.memo,
        existingItems.map((item) => item.memo),
      ),
      isActive:
        this.nextValue(
          dto.isActive,
          existingItems.map((item) => item.isActive),
        ) ?? true,
    };

    await this.repository.update(criteria, payload);
    return this.findOne(companyId, existingItems[0].id);
  }

  async update(
    companyId: number,
    id: number,
    dto: UpdateEmployeeCertificateDto,
  ) {
    await this.repository.update({ id, companyId }, dto);
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.repository.softDelete({ id, companyId });
  }

  private nextValue<T>(
    next: T | null | undefined,
    values: Array<T | null | undefined>,
  ) {
    if (next !== null && next !== undefined && next !== '') return next;
    return (
      values.find(
        (value) => value !== null && value !== undefined && value !== '',
      ) ?? null
    );
  }
}
