import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeCertificateDto } from './dto/create-employee-certificate.dto';
import { EmployeeCertificateQueryDto } from './dto/employee-certificate-query.dto';
import { UpdateEmployeeCertificateDto } from './dto/update-employee-certificate.dto';
import { EmployeeCertificate } from './entities/employee-certificate.entity';

@Injectable()
export class EmployeeCertificatesService {
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

    if (query.certificateTypeId) {
      builder.andWhere('employeeCertificate.certificateTypeId = :certificateTypeId', {
        certificateTypeId: query.certificateTypeId,
      });
    }

    if (query.isActive !== undefined) {
      builder.andWhere('employeeCertificate.isActive = :isActive', { isActive: query.isActive });
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
    if (!item) throw new NotFoundException('사원 자격증 정보를 찾을 수 없습니다.');
    return item;
  }

  create(companyId: number, dto: CreateEmployeeCertificateDto) {
    return this.repository.save(this.repository.create({ ...dto, companyId }));
  }

  async update(companyId: number, id: number, dto: UpdateEmployeeCertificateDto) {
    await this.repository.update({ id, companyId }, dto);
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.repository.softDelete({ id, companyId });
  }
}
