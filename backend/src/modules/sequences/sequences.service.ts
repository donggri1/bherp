import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateSequenceRuleDto } from './dto/create-sequence-rule.dto';
import { UpdateSequenceRuleDto } from './dto/update-sequence-rule.dto';
import { SequenceCurrent } from './entities/sequence-current.entity';
import { SequenceRule } from './entities/sequence-rule.entity';

@Injectable()
export class SequencesService {
  constructor(
    @InjectRepository(SequenceRule)
    private readonly ruleRepository: Repository<SequenceRule>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findRules(companyId: number, query: PaginationDto) {
    const [items, total] = await this.ruleRepository.findAndCount({
      where: { companyId },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { targetType: 'ASC' },
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  createRule(companyId: number, dto: CreateSequenceRuleDto) {
    return this.ruleRepository.save(this.ruleRepository.create({ ...dto, companyId }));
  }

  async updateRule(companyId: number, id: number, dto: UpdateSequenceRuleDto) {
    await this.ruleRepository.update({ id, companyId }, dto);
    const rule = await this.ruleRepository.findOne({ where: { id, companyId } });
    if (!rule) throw new NotFoundException('채번 규칙을 찾을 수 없습니다.');
    return rule;
  }

  removeRule(companyId: number, id: number) {
    return this.ruleRepository.softDelete({ id, companyId });
  }

  async issue(companyId: number, targetType: string): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      const ruleRepository = manager.getRepository(SequenceRule);
      const currentRepository = manager.getRepository(SequenceCurrent);
      const rule = await ruleRepository.findOne({
        where: { companyId, targetType, isActive: true },
      });
      if (!rule) throw new NotFoundException('채번 규칙을 찾을 수 없습니다.');

      const sequenceKey = this.buildSequenceKey(rule);
      let current = await currentRepository.findOne({
        where: { companyId, targetType, sequenceKey },
      });
      if (!current) {
        current = currentRepository.create({
          companyId,
          targetType,
          sequenceKey,
          currentNo: 0,
        });
      }

      current.currentNo += 1;
      await currentRepository.save(current);

      const paddedNo = String(current.currentNo).padStart(rule.currentLength, '0');
      const datePart = rule.dateFormat ? sequenceKey.replace(`${targetType}:`, '') : '';
      return [rule.prefix, datePart, paddedNo].filter(Boolean).join(rule.separator);
    });
  }

  private buildSequenceKey(rule: SequenceRule) {
    if (!rule.dateFormat) return `${rule.targetType}:DEFAULT`;
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateKey = rule.dateFormat
      .replace('YYYY', yyyy)
      .replace('MM', mm)
      .replace('DD', dd);
    return `${rule.targetType}:${dateKey}`;
  }
}
