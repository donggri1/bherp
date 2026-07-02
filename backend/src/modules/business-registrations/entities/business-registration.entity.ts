import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('business_registrations')
@Index(['companyId', 'businessCode'], { unique: true })
export class BusinessRegistration extends CompanyBaseEntity {
  @Column({ length: 50 })
  businessCode: string;

  @Column({ length: 120 })
  businessName: string;

  @Column({ length: 30, nullable: true })
  businessNumber?: string;

  @Column({ length: 50, nullable: true })
  ceoName?: string;

  @Column({ length: 80, nullable: true })
  businessType?: string;

  @Column({ length: 80, nullable: true })
  businessItem?: string;

  @Column({ length: 10, nullable: true })
  zipCode?: string;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ length: 255, nullable: true })
  detailAddress?: string;

  @Column({ length: 30, nullable: true })
  tel?: string;

  @Column({ length: 30, nullable: true })
  fax?: string;

  @Column({ length: 120, nullable: true })
  email?: string;

  @Column({ default: true })
  isActive: boolean;
}
