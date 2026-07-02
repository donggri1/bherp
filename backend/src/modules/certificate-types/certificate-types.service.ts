import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { SequencesService } from '../sequences/sequences.service';
import { CertificateTypeQueryDto } from './dto/certificate-type-query.dto';
import { CreateCertificateTypeDto } from './dto/create-certificate-type.dto';
import { UpdateCertificateTypeDto } from './dto/update-certificate-type.dto';
import { CertificateType } from './entities/certificate-type.entity';

@Injectable()
export class CertificateTypesService {
  constructor(
    @InjectRepository(CertificateType)
    private readonly repository: Repository<CertificateType>,
    private readonly sequencesService: SequencesService,
  ) {}

  async findAll(companyId: number, query: CertificateTypeQueryDto) {
    const baseWhere: FindOptionsWhere<CertificateType> = {
      companyId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    };
    const keyword = query.keyword?.trim();
    const where = keyword
      ? [
          { ...baseWhere, certificateTypeCode: Like(`%${keyword}%`) },
          { ...baseWhere, certificateTypeName: Like(`%${keyword}%`) },
          { ...baseWhere, issuer: Like(`%${keyword}%`) },
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
    if (!item) throw new NotFoundException('자격증 종류를 찾을 수 없습니다.');
    return item;
  }

  async create(companyId: number, dto: CreateCertificateTypeDto) {
    const certificateTypeCode =
      dto.certificateTypeCode?.trim() ||
      (await this.sequencesService.issue(companyId, 'CERTIFICATE_TYPE'));
    return this.repository.save(
      this.repository.create({ ...dto, certificateTypeCode, companyId }),
    );
  }

  async update(companyId: number, id: number, dto: UpdateCertificateTypeDto) {
    await this.repository.update({ id, companyId }, dto);
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.repository.softDelete({ id, companyId });
  }
}
