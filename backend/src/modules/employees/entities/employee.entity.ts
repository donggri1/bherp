import { Column, Entity, Index } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';

@Entity('employees')
@Index(['companyId', 'employeeCode'], { unique: true })
export class Employee extends CompanyBaseEntity {
  @Column({ length: 50 })
  employeeCode: string;

  @Column({ length: 100 })
  employeeName: string;

  @Column({ nullable: true })
  userId?: number;

  @Column({ nullable: true })
  businessUnitId?: number;

  @Column({ length: 100, nullable: true })
  departmentName?: string;

  @Column({ length: 100, nullable: true })
  positionName?: string;

  @Column({ length: 120, nullable: true })
  email?: string;

  @Column({ length: 30, nullable: true })
  phone?: string;

  @Column({ type: 'date', nullable: true })
  hireDate?: string;

  @Column({ type: 'date', nullable: true })
  resignDate?: string;

  @Column({ default: true })
  isActive: boolean;
}
