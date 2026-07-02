import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('sequence_currents')
@Index(['companyId', 'targetType', 'sequenceKey'], { unique: true })
export class SequenceCurrent extends CompanyBaseEntity {
  @Column({ length: 50 })
  targetType: string;

  @Column({ length: 80 })
  sequenceKey: string;

  @Column({ default: 0 })
  currentNo: number;
}
