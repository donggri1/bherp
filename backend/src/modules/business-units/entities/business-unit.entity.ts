import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('business_units')
@Index(['companyId', 'businessUnitCode'], { unique: true })
export class BusinessUnit extends CompanyBaseEntity {
  @Column({ length: 50 })
  businessUnitCode: string;

  @Column({ length: 120 })
  businessUnitName: string;

  @Column()
  businessRegistrationId: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;
}
