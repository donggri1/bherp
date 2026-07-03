import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
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
}
