import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('positions')
@Index(['companyId', 'positionCode'], { unique: true })
export class Position extends CompanyBaseEntity {
  @Column({ length: 50 })
  positionCode: string;

  @Column({ length: 120 })
  positionName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;
}
