import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Department } from '../departments/entities/department.entity';
import { Employee } from '../employees/entities/employee.entity';
import { OrganizationChartEmployeesQueryDto } from './dto/organization-chart-employees-query.dto';

type DepartmentEmployeeCountRaw = {
  departmentId: string | null;
  totalEmployees: string;
  activeEmployees: string | null;
};

export type OrganizationChartNode = {
  id: number;
  departmentCode: string;
  departmentName: string;
  businessUnitId?: number | null;
  parentId?: number | null;
  isActive: boolean;
  sortOrder: number;
  totalEmployees: number;
  activeEmployees: number;
  children: OrganizationChartNode[];
};

export type OrganizationChartEmployee = {
  id: number;
  employeeCode: string;
  employeeName: string;
  departmentId?: number | null;
  departmentName?: string | null;
  positionId?: number | null;
  positionName?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  resignDate?: string | null;
  isActive: boolean;
  employmentStatus: 'active' | 'resigned' | 'inactive';
};

@Injectable()
export class OrganizationChartService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async getChart(companyId: number) {
    const today = this.toDateString(new Date());
    const [departments, employeeCounts] = await Promise.all([
      this.departmentRepository.find({
        where: { companyId },
        order: { sortOrder: 'ASC', id: 'ASC' },
      }),
      this.getEmployeeCounts(companyId, today),
    ]);
    const countMap = new Map(
      employeeCounts.map((row) => [
        row.departmentId ? Number(row.departmentId) : null,
        {
          totalEmployees: this.toNumber(row.totalEmployees),
          activeEmployees: this.toNumber(row.activeEmployees),
        },
      ]),
    );
    const nodeMap = new Map<number, OrganizationChartNode>();

    for (const department of departments) {
      const counts = countMap.get(department.id) ?? {
        totalEmployees: 0,
        activeEmployees: 0,
      };
      nodeMap.set(department.id, {
        id: department.id,
        departmentCode: department.departmentCode,
        departmentName: department.departmentName,
        businessUnitId: department.businessUnitId,
        parentId: department.parentId,
        isActive: department.isActive,
        sortOrder: department.sortOrder,
        totalEmployees: counts.totalEmployees,
        activeEmployees: counts.activeEmployees,
        children: [],
      });
    }

    const roots: OrganizationChartNode[] = [];
    for (const node of nodeMap.values()) {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)?.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const unassigned = countMap.get(null) ?? {
      totalEmployees: 0,
      activeEmployees: 0,
    };

    return {
      totals: {
        departmentCount: departments.length,
        totalEmployees: [...countMap.values()].reduce(
          (sum, item) => sum + item.totalEmployees,
          0,
        ),
        activeEmployees: [...countMap.values()].reduce(
          (sum, item) => sum + item.activeEmployees,
          0,
        ),
        unassignedEmployees: unassigned.totalEmployees,
      },
      items: roots,
    };
  }

  async getDepartmentEmployees(
    companyId: number,
    departmentId: number,
    query: OrganizationChartEmployeesQueryDto,
  ) {
    const today = this.toDateString(new Date());
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId, companyId },
    });

    const builder = this.employeeRepository
      .createQueryBuilder('employee')
      .where('employee.companyId = :companyId', { companyId })
      .andWhere(
        new Brackets((where) => {
          where.where('employee.departmentId = :departmentId', { departmentId });
          if (department?.departmentName) {
            where.orWhere(
              new Brackets((fallback) => {
                fallback
                  .where('employee.departmentId IS NULL')
                  .andWhere('employee.departmentName = :departmentName', {
                    departmentName: department.departmentName,
                  });
              }),
            );
          }
        }),
      )
      .orderBy('employee.isActive', 'DESC')
      .addOrderBy('employee.employeeName', 'ASC')
      .addOrderBy('employee.id', 'ASC');

    const [items, total] = await builder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return {
      department: department
        ? {
            id: department.id,
            departmentCode: department.departmentCode,
            departmentName: department.departmentName,
          }
        : null,
      items: items.map((item) => this.toChartEmployee(item, today)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  private getEmployeeCounts(companyId: number, today: string) {
    return this.employeeRepository
      .createQueryBuilder('employee')
      .select('employee.departmentId', 'departmentId')
      .addSelect('COUNT(*)', 'totalEmployees')
      .addSelect(
        `SUM(CASE WHEN employee.isActive = 1 AND (employee.resignDate IS NULL OR employee.resignDate > :today) THEN 1 ELSE 0 END)`,
        'activeEmployees',
      )
      .where('employee.companyId = :companyId', { companyId })
      .setParameter('today', today)
      .groupBy('employee.departmentId')
      .getRawMany<DepartmentEmployeeCountRaw>();
  }

  private toDateString(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toNumber(value: string | number | null | undefined) {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
  }

  private toChartEmployee(
    employee: Employee,
    today: string,
  ): OrganizationChartEmployee {
    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      departmentId: employee.departmentId,
      departmentName: employee.departmentName,
      positionId: employee.positionId,
      positionName: employee.positionName,
      phone: employee.phone,
      hireDate: employee.hireDate,
      resignDate: employee.resignDate,
      isActive: employee.isActive,
      employmentStatus: this.employmentStatus(employee, today),
    };
  }

  private employmentStatus(employee: Employee, today: string) {
    if (!employee.isActive) return 'inactive';
    if (employee.resignDate && employee.resignDate <= today) return 'resigned';
    return 'active';
  }
}
