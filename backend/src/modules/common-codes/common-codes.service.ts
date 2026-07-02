import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateCommonCodeDto } from './dto/create-common-code.dto';
import { CreateCommonCodeGroupDto } from './dto/create-common-code-group.dto';
import { UpdateCommonCodeDto } from './dto/update-common-code.dto';
import { UpdateCommonCodeGroupDto } from './dto/update-common-code-group.dto';
import { CommonCode } from './entities/common-code.entity';
import { CommonCodeGroup } from './entities/common-code-group.entity';

@Injectable()
export class CommonCodesService {
  constructor(
    @InjectRepository(CommonCodeGroup)
    private readonly groupRepository: Repository<CommonCodeGroup>,
    @InjectRepository(CommonCode)
    private readonly codeRepository: Repository<CommonCode>,
  ) {}

  async findGroups(companyId: number, query: PaginationDto) {
    const [items, total] = await this.groupRepository.findAndCount({
      where: { companyId },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { groupCode: 'ASC' },
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  createGroup(companyId: number, dto: CreateCommonCodeGroupDto) {
    return this.groupRepository.save(this.groupRepository.create({ ...dto, companyId }));
  }

  async updateGroup(companyId: number, id: number, dto: UpdateCommonCodeGroupDto) {
    await this.groupRepository.update({ id, companyId }, dto);
    const group = await this.groupRepository.findOne({ where: { id, companyId } });
    if (!group) throw new NotFoundException('공통코드 그룹을 찾을 수 없습니다.');
    return group;
  }

  removeGroup(companyId: number, id: number) {
    return this.groupRepository.softDelete({ id, companyId });
  }

  async findCodes(companyId: number, groupCode: string | undefined, query: PaginationDto) {
    const [items, total] = await this.codeRepository.findAndCount({
      where: groupCode ? { companyId, groupCode } : { companyId },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { groupCode: 'ASC', sortOrder: 'ASC' },
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  createCode(companyId: number, dto: CreateCommonCodeDto) {
    return this.codeRepository.save(this.codeRepository.create({ ...dto, companyId }));
  }

  async updateCode(companyId: number, id: number, dto: UpdateCommonCodeDto) {
    await this.codeRepository.update({ id, companyId }, dto);
    const code = await this.codeRepository.findOne({ where: { id, companyId } });
    if (!code) throw new NotFoundException('공통코드를 찾을 수 없습니다.');
    return code;
  }

  removeCode(companyId: number, id: number) {
    return this.codeRepository.softDelete({ id, companyId });
  }
}
