import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { SequencesService } from '../sequences/sequences.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly repository: Repository<Project>,
    private readonly sequencesService: SequencesService,
  ) {}

  async findAll(companyId: number, query: ProjectQueryDto) {
    const baseWhere: FindOptionsWhere<Project> = {
      companyId,
      ...(query.projectStatus ? { projectStatus: query.projectStatus } : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    };
    const keyword = query.keyword?.trim();
    const where = keyword
      ? [
          { ...baseWhere, projectCode: Like(`%${keyword}%`) },
          { ...baseWhere, constructionNo: Like(`%${keyword}%`) },
          { ...baseWhere, projectName: Like(`%${keyword}%`) },
          { ...baseWhere, clientName: Like(`%${keyword}%`) },
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
    if (!item) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    return item;
  }

  async create(companyId: number, dto: CreateProjectDto) {
    const projectCode =
      dto.projectCode?.trim() || (await this.sequencesService.issue(companyId, 'PROJECT'));
    return this.repository.save(
      this.repository.create({
        companyId,
        ...this.normalizeCreateDto(dto),
        projectCode,
      }),
    );
  }

  async update(companyId: number, id: number, dto: UpdateProjectDto) {
    await this.repository.update({ id, companyId }, this.normalizeUpdateDto(dto));
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.repository.softDelete({ id, companyId });
  }

  private normalizeCreateDto(dto: CreateProjectDto): Partial<Project> {
    return {
      constructionNo: this.nullableText(dto.constructionNo),
      projectName: dto.projectName.trim(),
      clientName: this.nullableText(dto.clientName),
      siteAddress: this.nullableText(dto.siteAddress),
      startDate: dto.startDate || null,
      endDate: dto.endDate || null,
      projectStatus: dto.projectStatus || 'planned',
      memo: this.nullableText(dto.memo),
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    };
  }

  private normalizeUpdateDto(dto: UpdateProjectDto): Partial<Project> {
    const payload: Partial<Project> = {};
    if (dto.projectCode !== undefined) payload.projectCode = dto.projectCode.trim();
    if (dto.constructionNo !== undefined) {
      payload.constructionNo = this.nullableText(dto.constructionNo);
    }
    if (dto.projectName !== undefined) payload.projectName = dto.projectName.trim();
    if (dto.clientName !== undefined) payload.clientName = this.nullableText(dto.clientName);
    if (dto.siteAddress !== undefined) payload.siteAddress = this.nullableText(dto.siteAddress);
    if (dto.startDate !== undefined) payload.startDate = dto.startDate || null;
    if (dto.endDate !== undefined) payload.endDate = dto.endDate || null;
    if (dto.projectStatus !== undefined) payload.projectStatus = dto.projectStatus;
    if (dto.memo !== undefined) payload.memo = this.nullableText(dto.memo);
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) payload.sortOrder = dto.sortOrder;
    return payload;
  }

  private nullableText(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed || null;
  }
}
