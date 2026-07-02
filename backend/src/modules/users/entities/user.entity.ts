import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('users')
@Index(['companyId', 'loginId'], { unique: true })
export class User extends CompanyBaseEntity {
  @Column({ length: 50 })
  loginId: string;

  @Column({ select: false })
  password: string;

  @Column({ length: 100 })
  userName: string;

  @Column({ length: 120, nullable: true })
  email?: string;

  @Column({ length: 30, nullable: true })
  phone?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date | null;

  @Column({ type: 'text', nullable: true, select: false })
  refreshTokenHash?: string | null;
}
