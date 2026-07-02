import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('employee_certificates')
@Index(['companyId', 'employeeId', 'certificateTypeId'])
export class EmployeeCertificate extends CompanyBaseEntity {
  @Column()
  employeeId: number;

  @Column()
  certificateTypeId: number;

  @Column({ length: 80, nullable: true })
  certificateNo?: string;

  @Column({ length: 120, nullable: true })
  issuer?: string;

  @Column({ type: 'date', nullable: true })
  acquiredDate?: string;

  @Column({ type: 'date', nullable: true })
  expiredDate?: string;

  @Column({ length: 500, nullable: true })
  memo?: string;

  @Column({ default: true })
  isActive: boolean;
}
