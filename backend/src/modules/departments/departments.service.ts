import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { SequencesService } from '../sequences/sequences.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentQueryDto } from './dto/department-query.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly repository: Repository<Department>,
    private readonly sequencesService: SequencesService,
  ) {}

  async findAll(companyId: number, query: DepartmentQueryDto) {
    const baseWhere: FindOptionsWhere<Department> = {
      companyId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    };
    const keyword = query.keyword?.trim();
    const where = keyword
      ? [
          { ...baseWhere, departmentCode: Like(`%${keyword}%`) },
          { ...baseWhere, departmentName: Like(`%${keyword}%`) },
        ]
      : baseWhere;

    const [items, total] = await this.repository.findAndCount({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { sortOrder: 'ASC', id: 'DESC' },
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(companyId: number, id: number) {
    const item = await this.repository.findOne({ where: { id, companyId } });
    if (!item) throw new NotFoundException('부서를 찾을 수 없습니다.');
    return item;
  }

  async create(companyId: number, dto: CreateDepartmentDto) {
    const departmentCode =
      dto.departmentCode?.trim() || (await this.sequencesService.issue(companyId, 'DEPARTMENT'));
    return this.repository.save(this.repository.create({ ...dto, departmentCode, companyId }));
  }

  async update(companyId: number, id: number, dto: UpdateDepartmentDto) {
    await this.repository.update({ id, companyId }, dto);
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.repository.softDelete({ id, companyId });
  }
}
