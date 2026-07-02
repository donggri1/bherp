import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { SequencesService } from '../sequences/sequences.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { PositionQueryDto } from './dto/position-query.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { Position } from './entities/position.entity';

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private readonly repository: Repository<Position>,
    private readonly sequencesService: SequencesService,
  ) {}

  async findAll(companyId: number, query: PositionQueryDto) {
    const baseWhere: FindOptionsWhere<Position> = {
      companyId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    };
    const keyword = query.keyword?.trim();
    const where = keyword
      ? [
          { ...baseWhere, positionCode: Like(`%${keyword}%`) },
          { ...baseWhere, positionName: Like(`%${keyword}%`) },
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
    if (!item) throw new NotFoundException('직위를 찾을 수 없습니다.');
    return item;
  }

  async create(companyId: number, dto: CreatePositionDto) {
    const positionCode =
      dto.positionCode?.trim() || (await this.sequencesService.issue(companyId, 'POSITION'));
    return this.repository.save(this.repository.create({ ...dto, positionCode, companyId }));
  }

  async update(companyId: number, id: number, dto: UpdatePositionDto) {
    await this.repository.update({ id, companyId }, dto);
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.repository.softDelete({ id, companyId });
  }
}
