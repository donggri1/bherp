import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';
import { BusinessUnit } from '../../business-units/entities/business-unit.entity';
import { Department } from '../../departments/entities/department.entity';
import { Position } from '../../positions/entities/position.entity';
import { User } from '../../users/entities/user.entity';

@Entity('employees')
@Index(['companyId', 'employeeCode'], { unique: true })
export class Employee extends CompanyBaseEntity {
  @Column({ length: 50 })
  employeeCode: string;

  @Column({ length: 100 })
  employeeName: string;

  @Column({ type: 'int', nullable: true })
  userId?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User | null;

  @Column({ type: 'int', nullable: true })
  businessUnitId?: number | null;

  @ManyToOne(() => BusinessUnit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'businessUnitId' })
  businessUnit?: BusinessUnit | null;

  @Column({ type: 'int', nullable: true })
  departmentId?: number | null;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departmentId' })
  department?: Department | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  departmentName?: string | null;

  @Column({ type: 'int', nullable: true })
  positionId?: number | null;

  @ManyToOne(() => Position, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'positionId' })
  position?: Position | null;

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
