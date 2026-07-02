import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('common_codes')
@Index(['companyId', 'groupCode', 'code'], { unique: true })
export class CommonCode extends CompanyBaseEntity {
  @Column({ length: 80 })
  groupCode: string;

  @Column({ length: 80 })
  code: string;

  @Column({ length: 100 })
  codeName: string;

  @Column({ length: 120, nullable: true })
  value1?: string;

  @Column({ length: 120, nullable: true })
  value2?: string;

  @Column({ length: 120, nullable: true })
  value3?: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ default: true })
  isActive: boolean;
}
