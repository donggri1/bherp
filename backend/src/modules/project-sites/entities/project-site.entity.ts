import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('project_sites')
@Index(['companyId', 'siteCode'], { unique: true })
@Index(['companyId', 'projectId'])
export class ProjectSite extends CompanyBaseEntity {
  @Column({ length: 50 })
  siteCode: string;

  @Column()
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'projectId' })
  project?: Project;

  @Column({ length: 150 })
  siteName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  siteAddress?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  managerName?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  managerPhone?: string | null;

  @Column({ type: 'date', nullable: true })
  startDate?: string | null;

  @Column({ type: 'date', nullable: true })
  endDate?: string | null;

  @Column({ length: 30, default: 'planned' })
  siteStatus: string;

  @Column({ type: 'text', nullable: true })
  memo?: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;
}
