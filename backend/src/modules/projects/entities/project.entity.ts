import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('projects')
@Index(['companyId', 'projectCode'], { unique: true })
@Index(['companyId', 'constructionNo'])
export class Project extends CompanyBaseEntity {
  @Column({ length: 50 })
  projectCode: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  constructionNo?: string | null;

  @Column({ length: 150 })
  projectName: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  clientName?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  siteAddress?: string | null;

  @Column({ type: 'date', nullable: true })
  startDate?: string | null;

  @Column({ type: 'date', nullable: true })
  endDate?: string | null;

  @Column({ length: 30, default: 'planned' })
  projectStatus: string;

  @Column({ type: 'text', nullable: true })
  memo?: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;
}
