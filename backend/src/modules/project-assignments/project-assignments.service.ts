import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Employee } from '../employees/entities/employee.entity';
import { ProjectSite } from '../project-sites/entities/project-site.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateProjectAssignmentDto } from './dto/create-project-assignment.dto';
import { ProjectAssignmentQueryDto } from './dto/project-assignment-query.dto';
import { UpdateProjectAssignmentDto } from './dto/update-project-assignment.dto';
import { ProjectAssignment } from './entities/project-assignment.entity';

@Injectable()
export class ProjectAssignmentsService {
  constructor(
    @InjectRepository(ProjectAssignment)
    private readonly repository: Repository<ProjectAssignment>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectSite)
    private readonly projectSiteRepository: Repository<ProjectSite>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async findAll(companyId: number, query: ProjectAssignmentQueryDto) {
    const builder = this.repository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.project', 'project')
      .leftJoinAndSelect('assignment.projectSite', 'projectSite')
      .leftJoinAndSelect('assignment.employee', 'employee')
      .where('assignment.companyId = :companyId', { companyId });

    if (query.projectId) {
      builder.andWhere('assignment.projectId = :projectId', { projectId: query.projectId });
    }
    if (query.projectSiteId) {
      builder.andWhere('assignment.projectSiteId = :projectSiteId', {
        projectSiteId: query.projectSiteId,
      });
    }
    if (query.employeeId) {
      builder.andWhere('assignment.employeeId = :employeeId', { employeeId: query.employeeId });
    }
    if (query.assignmentStatus) {
      builder.andWhere('assignment.assignmentStatus = :assignmentStatus', {
        assignmentStatus: query.assignmentStatus,
      });
    }
    if (query.isActive !== undefined) {
      builder.andWhere('assignment.isActive = :isActive', { isActive: query.isActive });
    }

    const keyword = query.keyword?.trim();
    if (keyword) {
      builder.andWhere(
        new Brackets((qb) => {
          qb.where('project.projectCode LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('project.constructionNo LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('project.projectName LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('projectSite.siteCode LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('projectSite.siteName LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('employee.employeeCode LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('employee.employeeName LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('assignment.assignmentRole LIKE :keyword', { keyword: `%${keyword}%` });
        }),
      );
    }

    const [items, total] = await builder
      .orderBy('assignment.sortOrder', 'ASC')
      .addOrderBy('assignment.startDate', 'DESC')
      .addOrderBy('assignment.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(companyId: number, id: number) {
    const item = await this.repository.findOne({
      where: { id, companyId },
      relations: { project: true, projectSite: true, employee: true },
    });
    if (!item) throw new NotFoundException('현장 인력 배치를 찾을 수 없습니다.');
    return item;
  }

  async create(companyId: number, dto: CreateProjectAssignmentDto) {
    await this.ensureProject(companyId, dto.projectId);
    await this.ensureProjectSite(companyId, dto.projectId, dto.projectSiteId);
    await this.ensureEmployee(companyId, dto.employeeId);
    return this.repository.save(
      this.repository.create({
        companyId,
        ...this.normalizeCreateDto(dto),
      }),
    );
  }

  async update(companyId: number, id: number, dto: UpdateProjectAssignmentDto) {
    const current = await this.findOne(companyId, id);
    const nextProjectId = dto.projectId ?? current.projectId;
    const nextProjectSiteId =
      dto.projectSiteId !== undefined ? dto.projectSiteId : current.projectSiteId;

    await this.ensureProject(companyId, nextProjectId);
    await this.ensureProjectSite(companyId, nextProjectId, nextProjectSiteId);
    if (dto.employeeId !== undefined) await this.ensureEmployee(companyId, dto.employeeId);

    await this.repository.update({ id, companyId }, this.normalizeUpdateDto(dto));
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.repository.softDelete({ id, companyId });
  }

  private async ensureProject(companyId: number, projectId: number) {
    const project = await this.projectRepository.findOne({ where: { id: projectId, companyId } });
    if (!project) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    return project;
  }

  private async ensureProjectSite(
    companyId: number,
    projectId: number,
    projectSiteId?: number | null,
  ) {
    if (!projectSiteId) return null;
    const site = await this.projectSiteRepository.findOne({
      where: { id: projectSiteId, companyId },
    });
    if (!site) throw new NotFoundException('현장 정보를 찾을 수 없습니다.');
    if (site.projectId !== projectId) {
      throw new BadRequestException('선택한 현장은 프로젝트와 일치하지 않습니다.');
    }
    return site;
  }

  private async ensureEmployee(companyId: number, employeeId: number) {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, companyId },
    });
    if (!employee) throw new NotFoundException('사원을 찾을 수 없습니다.');
    return employee;
  }

  private normalizeCreateDto(dto: CreateProjectAssignmentDto): Partial<ProjectAssignment> {
    return {
      projectId: dto.projectId,
      projectSiteId: dto.projectSiteId || null,
      employeeId: dto.employeeId,
      assignmentRole: this.nullableText(dto.assignmentRole),
      startDate: dto.startDate,
      endDate: dto.endDate || null,
      assignmentStatus: dto.assignmentStatus || 'planned',
      memo: this.nullableText(dto.memo),
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    };
  }

  private normalizeUpdateDto(dto: UpdateProjectAssignmentDto): Partial<ProjectAssignment> {
    const payload: Partial<ProjectAssignment> = {};
    if (dto.projectId !== undefined) payload.projectId = dto.projectId;
    if (dto.projectSiteId !== undefined) payload.projectSiteId = dto.projectSiteId || null;
    if (dto.employeeId !== undefined) payload.employeeId = dto.employeeId;
    if (dto.assignmentRole !== undefined) {
      payload.assignmentRole = this.nullableText(dto.assignmentRole);
    }
    if (dto.startDate !== undefined) payload.startDate = dto.startDate;
    if (dto.endDate !== undefined) payload.endDate = dto.endDate || null;
    if (dto.assignmentStatus !== undefined) payload.assignmentStatus = dto.assignmentStatus;
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
