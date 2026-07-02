import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { BusinessRegistrationQueryDto } from './dto/business-registration-query.dto';
import { CreateBusinessRegistrationDto } from './dto/create-business-registration.dto';
import { UpdateBusinessRegistrationDto } from './dto/update-business-registration.dto';
import { BusinessRegistration } from './entities/business-registration.entity';

@Injectable()
export class BusinessRegistrationsService {
  constructor(
    @InjectRepository(BusinessRegistration)
    private readonly repository: Repository<BusinessRegistration>,
  ) {}

  async findAll(companyId: number, query: BusinessRegistrationQueryDto) {
    const baseWhere: FindOptionsWhere<BusinessRegistration> = {
      companyId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    };
    const keyword = query.keyword?.trim();
    const where = keyword
      ? [
          { ...baseWhere, businessCode: Like(`%${keyword}%`) },
          { ...baseWhere, businessName: Like(`%${keyword}%`) },
          { ...baseWhere, businessNumber: Like(`%${keyword}%`) },
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
    if (!item) throw new NotFoundException('사업자 정보를 찾을 수 없습니다.');
    return item;
  }

  create(companyId: number, dto: CreateBusinessRegistrationDto) {
    return this.repository.save(this.repository.create({ ...dto, companyId }));
  }

  async update(companyId: number, id: number, dto: UpdateBusinessRegistrationDto) {
    await this.repository.update({ id, companyId }, dto);
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.repository.softDelete({ id, companyId });
  }
}
