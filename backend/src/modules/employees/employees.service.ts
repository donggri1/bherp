import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';
import { SequencesService } from '../sequences/sequences.service';

type EmployeePayload = Partial<
  Pick<
    Employee,
    | 'employeeCode'
    | 'employeeName'
    | 'userId'
    | 'businessUnitId'
    | 'departmentName'
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

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly repository: Repository<Employee>,
    private readonly sequencesService: SequencesService,
  ) {}

  async findAll(companyId: number, query: EmployeeQueryDto) {
    const baseWhere: FindOptionsWhere<Employee> = {
      companyId,
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
    const payload = this.toEmployeePayload({ ...dto, employeeCode });
    return this.repository.save(this.repository.create({ ...payload, companyId }));
  }

  async update(companyId: number, id: number, dto: UpdateEmployeeDto) {
    await this.repository.update({ id, companyId }, this.toEmployeePayload(dto));
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.repository.softDelete({ id, companyId });
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

  private toEmployeePayload(dto: CreateEmployeeDto | UpdateEmployeeDto): EmployeePayload {
    const payload: EmployeePayload = {};

    if (dto.employeeCode !== undefined) payload.employeeCode = dto.employeeCode.trim();
    if (dto.employeeName !== undefined) payload.employeeName = dto.employeeName.trim();
    if (dto.userId !== undefined) payload.userId = dto.userId;
    if (dto.businessUnitId !== undefined) payload.businessUnitId = dto.businessUnitId;
    if (dto.departmentName !== undefined) payload.departmentName = this.nullableText(dto.departmentName);
    if (dto.positionName !== undefined) payload.positionName = this.nullableText(dto.positionName);
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

  private nullableText(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
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
