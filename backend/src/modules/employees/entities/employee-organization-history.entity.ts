import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CompanyBaseEntity } from '../../../common/entities/company-base.entity';
import { BusinessUnit } from '../../business-units/entities/business-unit.entity';
import { Department } from '../../departments/entities/department.entity';
import { Position } from '../../positions/entities/position.entity';
import { Employee } from './employee.entity';

@Entity('employee_organization_histories')
@Index(['companyId', 'employeeId', 'isCurrent'])
@Index(['companyId', 'employeeId', 'effectiveFrom'])
export class EmployeeOrganizationHistory extends CompanyBaseEntity {
  @Column({ type: 'int' })
  employeeId: number;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @Column({ type: 'int', nullable: true })
  businessUnitId?: number | null;

  @ManyToOne(() => BusinessUnit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'businessUnitId' })
  businessUnit?: BusinessUnit | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  businessUnitName?: string | null;

  @Column({ type: 'int', nullable: true })
  departmentId?: number | null;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departmentId' })
  department?: Department | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  departmentName?: string | null;

  @Column({ type: 'int', nullable: true })
  positionId?: number | null;

  @ManyToOne(() => Position, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'positionId' })
  position?: Position | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  positionName?: string | null;

  @Column({ type: 'date' })
  effectiveFrom: string;

  @Column({ type: 'date', nullable: true })
  effectiveTo?: string | null;

  @Column({ default: true })
  isCurrent: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  changeReason?: string | null;
}
