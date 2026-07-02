import { Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class CompanyBaseEntity extends BaseEntity {
  @Index()
  @Column()
  companyId: number;
}
