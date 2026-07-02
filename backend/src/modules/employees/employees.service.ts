import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';
import { SequencesService } from '../sequences/sequences.service';

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
    return this.repository.save(this.repository.create({ ...dto, employeeCode, companyId }));
  }

  async update(companyId: number, id: number, dto: UpdateEmployeeDto) {
    await this.repository.update({ id, companyId }, dto);
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.repository.softDelete({ id, companyId });
  }
}
