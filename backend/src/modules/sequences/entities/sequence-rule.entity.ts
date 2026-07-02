import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('sequence_rules')
@Index(['companyId', 'targetType'], { unique: true })
export class SequenceRule extends CompanyBaseEntity {
  @Column({ length: 50 })
  targetType: string;

  @Column({ length: 30 })
  prefix: string;

  @Column({ length: 20, nullable: true })
  dateFormat?: string;

  @Column({ default: 6 })
  currentLength: number;

  @Column({ length: 5, default: '-' })
  separator: string;

  @Column({ length: 20, default: 'NONE' })
  resetCycle: string;

  @Column({ length: 80, nullable: true })
  example?: string;

  @Column({ default: true })
  isActive: boolean;
}
