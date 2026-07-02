import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { BusinessUnitQueryDto } from './dto/business-unit-query.dto';
import { CreateBusinessUnitDto } from './dto/create-business-unit.dto';
import { UpdateBusinessUnitDto } from './dto/update-business-unit.dto';
import { BusinessUnit } from './entities/business-unit.entity';

@Injectable()
export class BusinessUnitsService {
  constructor(
    @InjectRepository(BusinessUnit)
    private readonly repository: Repository<BusinessUnit>,
  ) {}

  async findAll(companyId: number, query: BusinessUnitQueryDto) {
    const baseWhere: FindOptionsWhere<BusinessUnit> = {
      companyId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    };
    const keyword = query.keyword?.trim();
    const where = keyword
      ? [
          { ...baseWhere, businessUnitCode: Like(`%${keyword}%`) },
          { ...baseWhere, businessUnitName: Like(`%${keyword}%`) },
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
    if (!item) throw new NotFoundException('사업단위를 찾을 수 없습니다.');
    return item;
  }

  create(companyId: number, dto: CreateBusinessUnitDto) {
    return this.repository.save(this.repository.create({ ...dto, companyId }));
  }

  async update(companyId: number, id: number, dto: UpdateBusinessUnitDto) {
    await this.repository.update({ id, companyId }, dto);
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.repository.softDelete({ id, companyId });
  }
}
