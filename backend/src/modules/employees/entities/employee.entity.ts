import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('employees')
@Index(['companyId', 'employeeCode'], { unique: true })
export class Employee extends CompanyBaseEntity {
  @Column({ length: 50 })
  employeeCode: string;

  @Column({ length: 100 })
  employeeName: string;

  @Column({ type: 'int', nullable: true })
  userId?: number | null;

  @Column({ type: 'int', nullable: true })
  businessUnitId?: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  departmentName?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  positionName?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  residentRegistrationNumber?: string | null;

  @Column({ type: 'date', nullable: true })
  hireDate?: string | null;

  @Column({ type: 'date', nullable: true })
  resignDate?: string | null;

  @Column({ default: true })
  isActive: boolean;
}
