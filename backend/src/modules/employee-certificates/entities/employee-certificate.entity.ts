import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('employee_certificates')
@Index(['companyId', 'employeeId', 'certificateTypeId'])
export class EmployeeCertificate extends CompanyBaseEntity {
  @Column({ type: 'int' })
  employeeId: number;

  @Column({ type: 'int' })
  certificateTypeId: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  certificateNo?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  issuer?: string | null;

  @Column({ type: 'date', nullable: true })
  acquiredDate?: string | null;

  @Column({ type: 'date', nullable: true })
  renewedDate?: string | null;

  @Column({ type: 'date', nullable: true })
  expiredDate?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  qualificationStatus?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  workHours?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  memo?: string | null;

  @Column({ default: true })
  isActive: boolean;
}
