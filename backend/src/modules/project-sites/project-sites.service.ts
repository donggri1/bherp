import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { SequencesService } from '../sequences/sequences.service';
import { CreateProjectSiteDto } from './dto/create-project-site.dto';
import { ProjectSiteQueryDto } from './dto/project-site-query.dto';
import { UpdateProjectSiteDto } from './dto/update-project-site.dto';
import { ProjectSite } from './entities/project-site.entity';

@Injectable()
export class ProjectSitesService {
  constructor(
    @InjectRepository(ProjectSite)
    private readonly repository: Repository<ProjectSite>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly sequencesService: SequencesService,
  ) {}

  async findAll(companyId: number, query: ProjectSiteQueryDto) {
    const builder = this.repository
      .createQueryBuilder('site')
      .leftJoinAndSelect('site.project', 'project')
      .where('site.companyId = :companyId', { companyId });

    if (query.projectId) {
      builder.andWhere('site.projectId = :projectId', { projectId: query.projectId });
    }
    if (query.siteStatus) {
      builder.andWhere('site.siteStatus = :siteStatus', { siteStatus: query.siteStatus });
    }
    if (query.isActive !== undefined) {
      builder.andWhere('site.isActive = :isActive', { isActive: query.isActive });
    }

    const keyword = query.keyword?.trim();
    if (keyword) {
      builder.andWhere(
        new Brackets((qb) => {
          qb.where('site.siteCode LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('site.siteName LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('site.siteAddress LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('site.managerName LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('project.projectCode LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('project.constructionNo LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('project.projectName LIKE :keyword', { keyword: `%${keyword}%` });
        }),
      );
    }

    const [items, total] = await builder
      .orderBy('site.sortOrder', 'ASC')
      .addOrderBy('site.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(companyId: number, id: number) {
    const item = await this.repository.findOne({
      where: { id, companyId },
      relations: { project: true },
    });
    if (!item) throw new NotFoundException('현장 정보를 찾을 수 없습니다.');
    return item;
  }

  async create(companyId: number, dto: CreateProjectSiteDto) {
    await this.ensureProject(companyId, dto.projectId);
    const siteCode =
      dto.siteCode?.trim() || (await this.sequencesService.issue(companyId, 'PROJECT_SITE'));
    return this.repository.save(
      this.repository.create({
        companyId,
        ...this.normalizeCreateDto(dto),
        siteCode,
      }),
    );
  }

  async update(companyId: number, id: number, dto: UpdateProjectSiteDto) {
    if (dto.projectId !== undefined) {
      await this.ensureProject(companyId, dto.projectId);
    }
    await this.repository.update({ id, companyId }, this.normalizeUpdateDto(dto));
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.repository.softDelete({ id, companyId });
  }

  private async ensureProject(companyId: number, projectId: number) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, companyId },
    });
    if (!project) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    return project;
  }

  private normalizeCreateDto(dto: CreateProjectSiteDto): Partial<ProjectSite> {
    return {
      projectId: dto.projectId,
      siteName: dto.siteName.trim(),
      siteAddress: this.nullableText(dto.siteAddress),
      managerName: this.nullableText(dto.managerName),
      managerPhone: this.nullableText(dto.managerPhone),
      startDate: dto.startDate || null,
      endDate: dto.endDate || null,
      siteStatus: dto.siteStatus || 'planned',
      memo: this.nullableText(dto.memo),
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    };
  }

  private normalizeUpdateDto(dto: UpdateProjectSiteDto): Partial<ProjectSite> {
    const payload: Partial<ProjectSite> = {};
    if (dto.siteCode !== undefined) payload.siteCode = dto.siteCode.trim();
    if (dto.projectId !== undefined) payload.projectId = dto.projectId;
    if (dto.siteName !== undefined) payload.siteName = dto.siteName.trim();
    if (dto.siteAddress !== undefined) payload.siteAddress = this.nullableText(dto.siteAddress);
    if (dto.managerName !== undefined) payload.managerName = this.nullableText(dto.managerName);
    if (dto.managerPhone !== undefined) payload.managerPhone = this.nullableText(dto.managerPhone);
    if (dto.startDate !== undefined) payload.startDate = dto.startDate || null;
    if (dto.endDate !== undefined) payload.endDate = dto.endDate || null;
    if (dto.siteStatus !== undefined) payload.siteStatus = dto.siteStatus;
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
