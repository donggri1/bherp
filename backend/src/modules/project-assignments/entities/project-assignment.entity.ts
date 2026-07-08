import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { ProjectSite } from '../../project-sites/entities/project-site.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('project_assignments')
@Index(['companyId', 'projectId'])
@Index(['companyId', 'projectSiteId'])
@Index(['companyId', 'employeeId'])
export class ProjectAssignment extends CompanyBaseEntity {
  @Column()
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'projectId' })
  project?: Project;

  @Column({ type: 'int', nullable: true })
  projectSiteId?: number | null;

  @ManyToOne(() => ProjectSite, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'projectSiteId' })
  projectSite?: ProjectSite | null;

  @Column()
  employeeId: number;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @Column({ type: 'varchar', length: 80, nullable: true })
  assignmentRole?: string | null;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string | null;

  @Column({ length: 30, default: 'planned' })
  assignmentStatus: string;

  @Column({ type: 'text', nullable: true })
  memo?: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;
}
