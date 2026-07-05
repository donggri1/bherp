import { Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Company } from '../../modules/companies/entities/company.entity';
import { BaseEntity } from './base.entity';

export abstract class CompanyBaseEntity extends BaseEntity {
  @Index()
  @Column()
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'companyId' })
  company?: Company;
}
