import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';
import { EmployeeCertificate } from '../../../modules/employee-certificates/entities/employee-certificate.entity';
import { Employee } from '../../../modules/employees/entities/employee.entity';

@Entity('distribution_workforce_certificates')
@Index(['companyId', 'employeeId', 'qualificationName'])
export class DistributionWorkforceCertificate extends CompanyBaseEntity {
  @Column({ type: 'int' })
  employeeId: number;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @Column({ type: 'int' })
  employeeCertificateId: number;

  @ManyToOne(() => EmployeeCertificate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeCertificateId' })
  employeeCertificate?: EmployeeCertificate;

  @Column({ type: 'varchar', length: 50 })
  qualificationName: string;

  @Column({ type: 'date', nullable: true })
  acquiredDate?: string | null;

  @Column({ type: 'date', nullable: true })
  renewedDate?: string | null;

  @Column({ type: 'date', nullable: true })
  expiredDate?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  qualificationStatus?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  certificateNo?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  workHours?: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  workPeriodFrom?: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  workPeriodTo?: string | null;

  @Column({ type: 'datetime', nullable: true })
  lastFetchedAt?: Date | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  lastFetchStatus?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastFetchMessage?: string | null;
}
