import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async findAll(query: PaginationDto) {
    const [items, total] = await this.companyRepository.findAndCount({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { id: 'DESC' },
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException('회사를 찾을 수 없습니다.');
    return company;
  }

  create(dto: CreateCompanyDto) {
    return this.companyRepository.save(this.companyRepository.create(dto));
  }

  async update(id: number, dto: UpdateCompanyDto) {
    await this.companyRepository.update({ id }, dto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.companyRepository.softDelete({ id });
  }
}
