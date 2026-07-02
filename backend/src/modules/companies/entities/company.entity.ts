import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('companies')
export class Company extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 50 })
  companyCode: string;

  @Column({ length: 100 })
  companyName: string;

  @Column({ length: 30, nullable: true })
  businessNumber?: string;

  @Column({ length: 50, nullable: true })
  ceoName?: string;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ length: 30, nullable: true })
  tel?: string;

  @Column({ default: true })
  isActive: boolean;
}
