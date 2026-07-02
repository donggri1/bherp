import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('role_menu_permissions')
@Index(['companyId', 'roleId', 'menuId'], { unique: true })
export class RoleMenuPermission extends CompanyBaseEntity {
  @Column()
  roleId: number;

  @Column()
  menuId: number;

  @Column({ default: false })
  canRead: boolean;

  @Column({ default: false })
  canCreate: boolean;

  @Column({ default: false })
  canUpdate: boolean;

  @Column({ default: false })
  canDelete: boolean;

  @Column({ default: false })
  canExcel: boolean;
}
