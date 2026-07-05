import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
@Index(['companyId', 'userId', 'roleId'], { unique: true })
export class UserRole extends CompanyBaseEntity {
  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column()
  roleId: number;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role?: Role;
}
