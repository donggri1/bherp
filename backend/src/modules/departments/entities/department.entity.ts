import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('departments')
@Index(['companyId', 'departmentCode'], { unique: true })
export class Department extends CompanyBaseEntity {
  @Column({ length: 50 })
  departmentCode: string;

  @Column({ length: 120 })
  departmentName: string;

  @Column({ nullable: true })
  businessUnitId?: number;

  @Column({ nullable: true })
  parentId?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;
}
