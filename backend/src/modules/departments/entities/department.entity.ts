import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';
import { BusinessUnit } from '../../business-units/entities/business-unit.entity';

@Entity('departments')
@Index(['companyId', 'departmentCode'], { unique: true })
export class Department extends CompanyBaseEntity {
  @Column({ length: 50 })
  departmentCode: string;

  @Column({ length: 120 })
  departmentName: string;

  @Column({ nullable: true })
  businessUnitId?: number | null;

  @ManyToOne(() => BusinessUnit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'businessUnitId' })
  businessUnit?: BusinessUnit | null;

  @Column({ nullable: true })
  parentId?: number | null;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent?: Department | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;
}
