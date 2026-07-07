import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { CreateEmployeeOrganizationHistoryDto } from './dto/create-employee-organization-history.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeOrganizationHistory } from './entities/employee-organization-history.entity';
import { Employee } from './entities/employee.entity';
import { BusinessUnit } from '../business-units/entities/business-unit.entity';
import { Department } from '../departments/entities/department.entity';
import { Position } from '../positions/entities/position.entity';
import { SequencesService } from '../sequences/sequences.service';

type EmployeePayload = Partial<
  Pick<
    Employee,
    | 'employeeCode'
    | 'employeeName'
    | 'userId'
    | 'businessUnitId'
    | 'departmentId'
    | 'departmentName'
    | 'positionId'
    | 'positionName'
    | 'email'
    | 'phone'
    | 'address'
    | 'residentRegistrationNumber'
    | 'hireDate'
    | 'resignDate'
    | 'isActive'
  >
>;

type EmployeeImportRowResult = {
  rowNo: number;
  status: 'created' | 'failed';
  employeeCode?: string | null;
  employeeName?: string | null;
  message: string;
};

type BackfillIssue = {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  value: string;
  reason: 'not_found' | 'ambiguous';
  matchedIds?: number[];
};

type BackfillBucket = {
  matched: number;
  updated: number;
  alreadyLinked: number;
  skippedBlank: number;
  issues: BackfillIssue[];
};

type EmployeeOrganizationSnapshot = Pick<
  EmployeeOrganizationHistory,
  | 'businessUnitId'
  | 'businessUnitName'
  | 'departmentId'
  | 'departmentName'
  | 'positionId'
  | 'positionName'
>;

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly repository: Repository<Employee>,
    @InjectRepository(EmployeeOrganizationHistory)
    private readonly organizationHistoryRepository: Repository<EmployeeOrganizationHistory>,
    @InjectRepository(BusinessUnit)
    private readonly businessUnitRepository: Repository<BusinessUnit>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    private readonly sequencesService: SequencesService,
  ) {}

  async findAll(companyId: number, query: EmployeeQueryDto) {
    const baseWhere: FindOptionsWhere<Employee> = {
      companyId,
      ...(query.employeeId === undefined ? {} : { id: query.employeeId }),
      ...(query.departmentId === undefined
        ? {}
        : { departmentId: query.departmentId }),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    };
    const keyword = query.keyword?.trim();
    const where = keyword
      ? [
          { ...baseWhere, employeeCode: Like(`%${keyword}%`) },
          { ...baseWhere, employeeName: Like(`%${keyword}%`) },
          { ...baseWhere, departmentName: Like(`%${keyword}%`) },
        ]
      : baseWhere;

    const [items, total] = await this.repository.findAndCount({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { id: 'DESC' },
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(companyId: number, id: number) {
    const item = await this.repository.findOne({ where: { id, companyId } });
    if (!item) throw new NotFoundException('사원을 찾을 수 없습니다.');
    return item;
  }

  async create(companyId: number, dto: CreateEmployeeDto) {
    const employeeCode =
      dto.employeeCode?.trim() || (await this.sequencesService.issue(companyId, 'EMPLOYEE'));
    const payload = await this.toEmployeePayload(companyId, { ...dto, employeeCode });
    const saved = await this.repository.save(this.repository.create({ ...payload, companyId }));
    await this.createInitialOrganizationHistory(companyId, saved);
    return saved;
  }

  async update(companyId: number, id: number, dto: UpdateEmployeeDto) {
    const current = await this.findOne(companyId, id);
    const payload = await this.toEmployeePayload(companyId, dto);
    const organizationTouched = this.hasOrganizationPayload(payload);

    await this.repository.update({ id, companyId }, payload);
    const saved = await this.findOne(companyId, id);

    if (organizationTouched && this.hasOrganizationChanged(current, saved)) {
      await this.replaceCurrentOrganizationHistory(companyId, saved, {
        effectiveFrom: this.today(),
        changeReason: '사원정보 수정',
      });
    }

    return saved;
  }

  remove(companyId: number, id: number) {
    return this.repository.softDelete({ id, companyId });
  }

  async findOrganizationHistories(companyId: number, employeeId: number) {
    await this.findOne(companyId, employeeId);
    return this.organizationHistoryRepository.find({
      where: { companyId, employeeId },
      order: { effectiveFrom: 'DESC', id: 'DESC' },
    });
  }

  async createOrganizationHistory(
    companyId: number,
    employeeId: number,
    dto: CreateEmployeeOrganizationHistoryDto,
  ) {
    const employee = await this.findOne(companyId, employeeId);
    const snapshot = await this.resolveOrganizationSnapshot(companyId, {
      businessUnitId:
        dto.businessUnitId === undefined ? employee.businessUnitId : dto.businessUnitId,
      departmentId: dto.departmentId === undefined ? employee.departmentId : dto.departmentId,
      departmentName: dto.departmentId === undefined ? employee.departmentName : null,
      positionId: dto.positionId === undefined ? employee.positionId : dto.positionId,
      positionName: dto.positionId === undefined ? employee.positionName : null,
    });
    const effectiveFrom = this.dateOnly(dto.effectiveFrom) ?? this.today();
    const saved = await this.replaceCurrentOrganizationHistory(companyId, employee, {
      ...snapshot,
      effectiveFrom,
      changeReason: this.nullableText(dto.changeReason) ?? '조직/직위 이력 등록',
    });

    await this.repository.update(
      { id: employeeId, companyId },
      {
        businessUnitId: snapshot.businessUnitId,
        departmentId: snapshot.departmentId,
        departmentName: snapshot.departmentName,
        positionId: snapshot.positionId,
        positionName: snapshot.positionName,
      },
    );

    return saved;
  }

  async backfillOrganizationHistories(companyId: number, dryRun = false) {
    const [employees, histories] = await Promise.all([
      this.repository.find({ where: { companyId }, order: { id: 'ASC' } }),
      this.organizationHistoryRepository.find({
        where: { companyId },
        select: { employeeId: true },
      }),
    ]);
    const existingEmployeeIds = new Set(histories.map((item) => item.employeeId));
    let created = 0;
    let skippedExisting = 0;
    let skippedBlank = 0;
    const items: Array<{
      employeeId: number;
      employeeCode: string;
      employeeName: string;
      status: 'created' | 'skipped_existing' | 'skipped_blank';
    }> = [];

    for (const employee of employees) {
      if (existingEmployeeIds.has(employee.id)) {
        skippedExisting += 1;
        items.push({
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          employeeName: employee.employeeName,
          status: 'skipped_existing',
        });
        continue;
      }

      const snapshot = await this.resolveOrganizationSnapshot(companyId, employee);
      if (!this.hasOrganizationSnapshotData(snapshot)) {
        skippedBlank += 1;
        items.push({
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          employeeName: employee.employeeName,
          status: 'skipped_blank',
        });
        continue;
      }

      created += 1;
      items.push({
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        employeeName: employee.employeeName,
        status: 'created',
      });

      if (!dryRun) {
        await this.organizationHistoryRepository.save(
          this.organizationHistoryRepository.create({
            ...snapshot,
            companyId,
            employeeId: employee.id,
            effectiveFrom: this.dateOnly(employee.hireDate) ?? this.today(),
            effectiveTo: null,
            isCurrent: true,
            changeReason: '기존 사원 현재 조직/직위 백필',
          }),
        );
      }
    }

    return {
      dryRun,
      totalEmployees: employees.length,
      created: dryRun ? 0 : created,
      creatable: created,
      skippedExisting,
      skippedBlank,
      items,
    };
  }

  async backfillOrganizationReferences(companyId: number, dryRun = false) {
    const [employees, departments, positions] = await Promise.all([
      this.repository.find({
        where: { companyId },
        order: { id: 'ASC' },
      }),
      this.departmentRepository.find({
        where: { companyId },
        order: { sortOrder: 'ASC', id: 'ASC' },
      }),
      this.positionRepository.find({
        where: { companyId },
        order: { sortOrder: 'ASC', id: 'ASC' },
      }),
    ]);
    const departmentMap = this.toNameMap(departments, (item) => item.departmentName);
    const positionMap = this.toNameMap(positions, (item) => item.positionName);
    const department: BackfillBucket = this.emptyBackfillBucket();
    const position: BackfillBucket = this.emptyBackfillBucket();

    for (const employee of employees) {
      const payload: EmployeePayload = {};

      this.applyDepartmentBackfill(
        employee,
        departmentMap,
        department,
        payload,
      );
      this.applyPositionBackfill(employee, positionMap, position, payload);

      if (!dryRun && Object.keys(payload).length) {
        await this.repository.update({ id: employee.id, companyId }, payload);
      }
    }

    if (dryRun) {
      department.updated = 0;
      position.updated = 0;
    }

    return {
      dryRun,
      totalEmployees: employees.length,
      department,
      position,
    };
  }

  async buildImportTemplate() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BHERP';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('사원등록');
    sheet.columns = [
      { header: '사원코드', key: 'employeeCode', width: 14 },
      { header: '사원명', key: 'employeeName', width: 16 },
      { header: '연결사용자ID', key: 'userId', width: 14 },
      { header: '사업단위ID', key: 'businessUnitId', width: 14 },
      { header: '부서', key: 'departmentName', width: 18 },
      { header: '직위', key: 'positionName', width: 14 },
      { header: '이메일', key: 'email', width: 28 },
      { header: '휴대폰', key: 'phone', width: 18 },
      { header: '주소', key: 'address', width: 36 },
      { header: '주민등록번호', key: 'residentRegistrationNumber', width: 18 },
      { header: '입사일', key: 'hireDate', width: 14 },
      { header: '퇴사일', key: 'resignDate', width: 14 },
      { header: '사용여부', key: 'isActive', width: 12 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEAF2FF' },
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = 'A1:M1';

    sheet.getColumn('hireDate').numFmt = 'yyyy-mm-dd';
    sheet.getColumn('resignDate').numFmt = 'yyyy-mm-dd';

    const guideSheet = workbook.addWorksheet('작성안내');
    guideSheet.columns = [
      { header: '항목', key: 'field', width: 20 },
      { header: '설명', key: 'description', width: 70 },
    ];
    guideSheet.getRow(1).font = { bold: true };
    guideSheet.addRows([
      { field: '입력 위치', description: '사원등록 시트의 2행부터 한 명씩 입력하세요.' },
      { field: '사원명', description: '필수입니다.' },
      { field: '사원코드', description: '비워두면 저장 시 자동 생성됩니다. 입력하면 중복되지 않아야 합니다.' },
      { field: '연결사용자ID/사업단위ID', description: '선택 입력입니다. ERP 내부 ID를 알고 있을 때만 입력하세요.' },
      { field: '주민등록번호', description: '민감정보입니다. 업무상 필요한 경우에만 입력하고 파일 공유/보관에 주의하세요.' },
      { field: '입사일/퇴사일', description: 'yyyy-mm-dd 형식으로 입력하세요. 예: 2026-07-01' },
      { field: '사용여부', description: '사용, 미사용, Y, N, true, false 중 하나를 입력하세요. 비워두면 사용입니다.' },
      { field: '예시', description: '사원명: 홍길동 / 부서: 공사팀 / 직위: 대리 / 휴대폰: 010-1234-5678 / 사용여부: 사용' },
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async importFromExcel(companyId: number, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('업로드할 Excel 파일을 선택하세요.');
    }
    if (!/\.(xlsx|xls)$/i.test(file.originalname)) {
      throw new BadRequestException('사원 등록 파일은 .xlsx 또는 .xls만 업로드할 수 있습니다.');
    }

    const workbook = XLSX.read(file.buffer, {
      type: 'buffer',
      cellDates: true,
      raw: false,
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : null;

    if (!sheet) {
      throw new BadRequestException('Excel 파일에서 시트를 찾을 수 없습니다.');
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false,
    });

    if (!rows.length) {
      throw new BadRequestException('등록할 사원 데이터가 없습니다.');
    }

    const items: EmployeeImportRowResult[] = [];

    for (const [index, row] of rows.entries()) {
      const rowNo = index + 2;
      const dto = this.excelRowToDto(row);
      const employeeName = dto.employeeName?.trim() || null;

      if (!employeeName) {
        items.push({
          rowNo,
          status: 'failed',
          employeeCode: dto.employeeCode ?? null,
          employeeName,
          message: '사원명은 필수입니다.',
        });
        continue;
      }

      try {
        const saved = await this.create(companyId, dto);
        items.push({
          rowNo,
          status: 'created',
          employeeCode: saved.employeeCode,
          employeeName: saved.employeeName,
          message: '등록되었습니다.',
        });
      } catch (error) {
        items.push({
          rowNo,
          status: 'failed',
          employeeCode: dto.employeeCode ?? null,
          employeeName,
          message: this.importErrorMessage(error),
        });
      }
    }

    return {
      created: items.filter((item) => item.status === 'created').length,
      failed: items.filter((item) => item.status === 'failed').length,
      items,
    };
  }

  private async toEmployeePayload(
    companyId: number,
    dto: CreateEmployeeDto | UpdateEmployeeDto,
  ): Promise<EmployeePayload> {
    const payload: EmployeePayload = {};

    if (dto.employeeCode !== undefined) payload.employeeCode = dto.employeeCode.trim();
    if (dto.employeeName !== undefined) payload.employeeName = dto.employeeName.trim();
    if (dto.userId !== undefined) payload.userId = dto.userId;
    if (dto.businessUnitId !== undefined) {
      const businessUnit = dto.businessUnitId
        ? await this.findBusinessUnit(companyId, dto.businessUnitId)
        : null;
      payload.businessUnitId = businessUnit?.id ?? null;
    }
    if (dto.departmentId !== undefined) {
      const department = dto.departmentId
        ? await this.findDepartment(companyId, dto.departmentId)
        : null;
      payload.departmentId = department?.id ?? null;
      payload.departmentName = department?.departmentName ?? null;
    } else if (dto.departmentName !== undefined) {
      payload.departmentName = this.nullableText(dto.departmentName);
    }
    if (dto.positionId !== undefined) {
      const position = dto.positionId
        ? await this.findPosition(companyId, dto.positionId)
        : null;
      payload.positionId = position?.id ?? null;
      payload.positionName = position?.positionName ?? null;
    } else if (dto.positionName !== undefined) {
      payload.positionName = this.nullableText(dto.positionName);
    }
    if (dto.email !== undefined) payload.email = this.nullableText(dto.email);
    if (dto.phone !== undefined) payload.phone = this.nullableText(dto.phone);
    if (dto.address !== undefined) payload.address = this.nullableText(dto.address);
    if (dto.residentRegistrationNumber !== undefined) {
      payload.residentRegistrationNumber = this.nullableText(dto.residentRegistrationNumber);
    }
    if (dto.hireDate !== undefined) payload.hireDate = this.nullableText(dto.hireDate);
    if (dto.resignDate !== undefined) payload.resignDate = this.nullableText(dto.resignDate);
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;

    return payload;
  }

  private async findBusinessUnit(companyId: number, businessUnitId: number) {
    const businessUnit = await this.businessUnitRepository.findOne({
      where: { id: businessUnitId, companyId },
    });
    if (!businessUnit) throw new NotFoundException('사업단위를 찾을 수 없습니다.');
    return businessUnit;
  }

  private async findDepartment(companyId: number, departmentId: number) {
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId, companyId },
    });
    if (!department) throw new NotFoundException('부서를 찾을 수 없습니다.');
    return department;
  }

  private async findPosition(companyId: number, positionId: number) {
    const position = await this.positionRepository.findOne({
      where: { id: positionId, companyId },
    });
    if (!position) throw new NotFoundException('직위를 찾을 수 없습니다.');
    return position;
  }

  private async createInitialOrganizationHistory(companyId: number, employee: Employee) {
    const snapshot = await this.resolveOrganizationSnapshot(companyId, employee);
    if (!this.hasOrganizationSnapshotData(snapshot)) return null;

    return this.organizationHistoryRepository.save(
      this.organizationHistoryRepository.create({
        ...snapshot,
        companyId,
        employeeId: employee.id,
        effectiveFrom: this.dateOnly(employee.hireDate) ?? this.today(),
        effectiveTo: null,
        isCurrent: true,
        changeReason: '사원 최초 등록',
      }),
    );
  }

  private async replaceCurrentOrganizationHistory(
    companyId: number,
    employee: Employee,
    options: Partial<EmployeeOrganizationSnapshot> & {
      effectiveFrom: string;
      changeReason?: string | null;
    },
  ) {
    const snapshot =
      options.businessUnitId !== undefined ||
      options.departmentId !== undefined ||
      options.positionId !== undefined
        ? (options as EmployeeOrganizationSnapshot)
        : await this.resolveOrganizationSnapshot(companyId, employee);
    const effectiveFrom = this.dateOnly(options.effectiveFrom) ?? this.today();

    await this.organizationHistoryRepository.update(
      { companyId, employeeId: employee.id, isCurrent: true },
      { isCurrent: false, effectiveTo: effectiveFrom },
    );

    return this.organizationHistoryRepository.save(
      this.organizationHistoryRepository.create({
        ...snapshot,
        companyId,
        employeeId: employee.id,
        effectiveFrom,
        effectiveTo: null,
        isCurrent: true,
        changeReason: this.nullableText(options.changeReason),
      }),
    );
  }

  private async resolveOrganizationSnapshot(
    companyId: number,
    source: Partial<
      Pick<
        Employee,
        | 'businessUnitId'
        | 'departmentId'
        | 'departmentName'
        | 'positionId'
        | 'positionName'
      >
    >,
  ): Promise<EmployeeOrganizationSnapshot> {
    const businessUnit = source.businessUnitId
      ? await this.findBusinessUnit(companyId, source.businessUnitId)
      : null;
    const department = source.departmentId
      ? await this.findDepartment(companyId, source.departmentId)
      : null;
    const position = source.positionId
      ? await this.findPosition(companyId, source.positionId)
      : null;

    return {
      businessUnitId: businessUnit?.id ?? null,
      businessUnitName: businessUnit?.businessUnitName ?? null,
      departmentId: department?.id ?? null,
      departmentName: department?.departmentName ?? this.nullableText(source.departmentName),
      positionId: position?.id ?? null,
      positionName: position?.positionName ?? this.nullableText(source.positionName),
    };
  }

  private hasOrganizationPayload(payload: EmployeePayload) {
    return (
      Object.prototype.hasOwnProperty.call(payload, 'businessUnitId') ||
      Object.prototype.hasOwnProperty.call(payload, 'departmentId') ||
      Object.prototype.hasOwnProperty.call(payload, 'departmentName') ||
      Object.prototype.hasOwnProperty.call(payload, 'positionId') ||
      Object.prototype.hasOwnProperty.call(payload, 'positionName')
    );
  }

  private hasOrganizationChanged(before: Employee, after: Employee) {
    return (
      this.nullableNumber(before.businessUnitId) !== this.nullableNumber(after.businessUnitId) ||
      this.nullableNumber(before.departmentId) !== this.nullableNumber(after.departmentId) ||
      this.nullableText(before.departmentName) !== this.nullableText(after.departmentName) ||
      this.nullableNumber(before.positionId) !== this.nullableNumber(after.positionId) ||
      this.nullableText(before.positionName) !== this.nullableText(after.positionName)
    );
  }

  private hasOrganizationSnapshotData(snapshot: EmployeeOrganizationSnapshot) {
    return Boolean(
      snapshot.businessUnitId ||
        snapshot.businessUnitName ||
        snapshot.departmentId ||
        snapshot.departmentName ||
        snapshot.positionId ||
        snapshot.positionName,
    );
  }

  private applyDepartmentBackfill(
    employee: Employee,
    departmentMap: Map<string, Department[]>,
    bucket: BackfillBucket,
    payload: EmployeePayload,
  ) {
    if (employee.departmentId) {
      bucket.alreadyLinked += 1;
      return;
    }

    const departmentName = this.nullableText(employee.departmentName);
    if (!departmentName) {
      bucket.skippedBlank += 1;
      return;
    }

    const matches = departmentMap.get(departmentName) ?? [];
    if (matches.length === 1) {
      bucket.matched += 1;
      bucket.updated += 1;
      payload.departmentId = matches[0].id;
      payload.departmentName = matches[0].departmentName;
      return;
    }

    bucket.issues.push({
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      value: departmentName,
      reason: matches.length ? 'ambiguous' : 'not_found',
      matchedIds: matches.length ? matches.map((item) => item.id) : undefined,
    });
  }

  private applyPositionBackfill(
    employee: Employee,
    positionMap: Map<string, Position[]>,
    bucket: BackfillBucket,
    payload: EmployeePayload,
  ) {
    if (employee.positionId) {
      bucket.alreadyLinked += 1;
      return;
    }

    const positionName = this.nullableText(employee.positionName);
    if (!positionName) {
      bucket.skippedBlank += 1;
      return;
    }

    const matches = positionMap.get(positionName) ?? [];
    if (matches.length === 1) {
      bucket.matched += 1;
      bucket.updated += 1;
      payload.positionId = matches[0].id;
      payload.positionName = matches[0].positionName;
      return;
    }

    bucket.issues.push({
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      value: positionName,
      reason: matches.length ? 'ambiguous' : 'not_found',
      matchedIds: matches.length ? matches.map((item) => item.id) : undefined,
    });
  }

  private toNameMap<T>(
    items: T[],
    getName: (item: T) => string | null | undefined,
  ) {
    const map = new Map<string, T[]>();
    for (const item of items) {
      const name = this.nullableText(getName(item));
      if (!name) continue;
      map.set(name, [...(map.get(name) ?? []), item]);
    }
    return map;
  }

  private emptyBackfillBucket(): BackfillBucket {
    return {
      matched: 0,
      updated: 0,
      alreadyLinked: 0,
      skippedBlank: 0,
      issues: [],
    };
  }

  private nullableText(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private nullableNumber(value: number | null | undefined) {
    return value ?? null;
  }

  private dateOnly(value: string | null | undefined) {
    const normalized = this.nullableText(value);
    return normalized ? normalized.slice(0, 10) : null;
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  private excelRowToDto(row: Record<string, unknown>): CreateEmployeeDto {
    return {
      employeeCode: this.optionalString(this.cell(row, '사원코드', 'employeeCode')),
      employeeName: this.optionalString(this.cell(row, '사원명', 'employeeName')) ?? '',
      userId: this.optionalNumber(this.cell(row, '연결사용자ID', 'userId')),
      businessUnitId: this.optionalNumber(this.cell(row, '사업단위ID', 'businessUnitId')),
      departmentName: this.optionalString(this.cell(row, '부서', 'departmentName')),
      positionName: this.optionalString(this.cell(row, '직위', 'positionName')),
      email: this.optionalString(this.cell(row, '이메일', 'email')),
      phone: this.optionalString(this.cell(row, '휴대폰', 'phone')),
      address: this.optionalString(this.cell(row, '주소', 'address')),
      residentRegistrationNumber: this.optionalString(
        this.cell(row, '주민등록번호', 'residentRegistrationNumber'),
      ),
      hireDate: this.optionalDateString(this.cell(row, '입사일', 'hireDate')),
      resignDate: this.optionalDateString(this.cell(row, '퇴사일', 'resignDate')),
      isActive: this.optionalBoolean(this.cell(row, '사용여부', 'isActive')),
    };
  }

  private cell(row: Record<string, unknown>, ...headers: string[]) {
    const normalizedHeaders = headers.map((header) => this.normalizeHeader(header));
    const found = Object.entries(row).find(([key]) =>
      normalizedHeaders.includes(this.normalizeHeader(key)),
    );
    return found?.[1];
  }

  private normalizeHeader(value: string) {
    return value.replace(/\s+/g, '').toLowerCase();
  }

  private optionalString(value: unknown) {
    if (value === null || value === undefined) return undefined;
    const text = String(value).trim();
    return text ? text : undefined;
  }

  private optionalNumber(value: unknown) {
    const text = this.optionalString(value);
    if (!text) return undefined;
    const number = Number(text);
    return Number.isInteger(number) ? number : undefined;
  }

  private optionalDateString(value: unknown) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    const text = this.optionalString(value);
    if (!text) return undefined;
    const normalized = text.replace(/[./]/g, '-');
    const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return text;
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  private optionalBoolean(value: unknown) {
    const text = this.optionalString(value);
    if (!text) return undefined;
    const normalized = text.toLowerCase();
    if (['사용', 'y', 'yes', 'true', '1'].includes(normalized)) return true;
    if (['미사용', 'n', 'no', 'false', '0'].includes(normalized)) return false;
    return undefined;
  }

  private importErrorMessage(error: unknown) {
    if (!(error instanceof Error)) return '등록에 실패했습니다.';
    if (error.message.includes('Duplicate entry')) return '중복된 값이 있어 등록할 수 없습니다.';
    return error.message;
  }
}
