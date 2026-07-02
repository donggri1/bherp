import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('roles')
@Index(['companyId', 'roleCode'], { unique: true })
export class Role extends CompanyBaseEntity {
  @Column({ length: 50 })
  roleCode: string;

  @Column({ length: 100 })
  roleName: string;

  @Column({ length: 255, nullable: true })
  description?: string;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ default: true })
  isActive: boolean;
}
