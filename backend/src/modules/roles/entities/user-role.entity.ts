import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('user_roles')
@Index(['companyId', 'userId', 'roleId'], { unique: true })
export class UserRole extends CompanyBaseEntity {
  @Column()
  userId: number;

  @Column()
  roleId: number;
}
