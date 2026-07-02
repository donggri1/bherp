import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('common_code_groups')
@Index(['companyId', 'groupCode'], { unique: true })
export class CommonCodeGroup extends CompanyBaseEntity {
  @Column({ length: 80 })
  groupCode: string;

  @Column({ length: 100 })
  groupName: string;

  @Column({ length: 255, nullable: true })
  description?: string;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ default: true })
  isActive: boolean;
}
