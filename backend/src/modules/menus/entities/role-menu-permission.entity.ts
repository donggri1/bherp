import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';
import { Role } from '../../roles/entities/role.entity';
import { Menu } from './menu.entity';

@Entity('role_menu_permissions')
@Index(['companyId', 'roleId', 'menuId'], { unique: true })
export class RoleMenuPermission extends CompanyBaseEntity {
  @Column()
  roleId: number;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role?: Role;

  @Column()
  menuId: number;

  @ManyToOne(() => Menu, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menuId' })
  menu?: Menu;

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
