import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('certificate_types')
@Index(['companyId', 'certificateTypeCode'], { unique: true })
export class CertificateType extends CompanyBaseEntity {
  @Column({ length: 50 })
  certificateTypeCode: string;

  @Column({ length: 120 })
  certificateTypeName: string;

  @Column({ length: 120, nullable: true })
  issuer?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;
}
