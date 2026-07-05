import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';
import { BusinessRegistration } from '../../business-registrations/entities/business-registration.entity';

@Entity('business_units')
@Index(['companyId', 'businessUnitCode'], { unique: true })
export class BusinessUnit extends CompanyBaseEntity {
  @Column({ length: 50 })
  businessUnitCode: string;

  @Column({ length: 120 })
  businessUnitName: string;

  @Column()
  businessRegistrationId: number;

  @ManyToOne(() => BusinessRegistration, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'businessRegistrationId' })
  businessRegistration?: BusinessRegistration;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;
}
