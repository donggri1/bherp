import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { EmployeeCertificate } from '../employee-certificates/entities/employee-certificate.entity';
import { Employee } from '../employees/entities/employee.entity';
import { HrDashboardQueryDto } from './dto/hr-dashboard-query.dto';

type DepartmentHeadcountRaw = {
  departmentName: string | null;
  totalCount: string;
  activeCount: string | null;
  resignedCount: string | null;
};

@Injectable()
export class HrDashboardService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(EmployeeCertificate)
    private readonly employeeCertificateRepository: Repository<EmployeeCertificate>,
  ) {}

  async getDashboard(companyId: number, query: HrDashboardQueryDto) {
    const expiryDays = query.expiryDays ?? 30;
    const today = this.toDateString(new Date());
    const expiryDateTo = this.toDateString(this.addDays(new Date(), expiryDays));

    const [
      totalEmployees,
      activeEmployees,
      resignedEmployees,
      activeCertificates,
      expiringCertificates,
      expiredCertificates,
      departmentHeadcounts,
      certificateExpiryItems,
    ] = await Promise.all([
      this.countTotalEmployees(companyId),
      this.countActiveEmployees(companyId, today),
      this.countResignedEmployees(companyId, today),
      this.countActiveCertificates(companyId),
      this.countExpiringCertificates(companyId, today, expiryDateTo),
      this.countExpiredCertificates(companyId, today),
      this.getDepartmentHeadcounts(companyId, today),
      this.getCertificateExpiryItems(companyId, today, expiryDateTo),
    ]);

    return {
      summary: {
        totalEmployees,
        activeEmployees,
        resignedEmployees,
        activeCertificates,
        expiringCertificates,
        expiredCertificates,
        expiryDays,
        today,
        expiryDateTo,
      },
      departmentHeadcounts,
      certificateExpiryItems,
    };
  }

  private countTotalEmployees(companyId: number) {
    return this.employeeRepository.count({ where: { companyId } });
  }

  private countActiveEmployees(companyId: number, today: string) {
    return this.employeeRepository
      .createQueryBuilder('employee')
      .where('employee.companyId = :companyId', { companyId })
      .andWhere('employee.isActive = :isActive', { isActive: true })
      .andWhere(
        new Brackets((builder) => {
          builder
            .where('employee.resignDate IS NULL')
            .orWhere('employee.resignDate > :today', { today });
        }),
      )
      .getCount();
  }

  private countResignedEmployees(companyId: number, today: string) {
    return this.employeeRepository
      .createQueryBuilder('employee')
      .where('employee.companyId = :companyId', { companyId })
      .andWhere('employee.resignDate IS NOT NULL')
      .andWhere('employee.resignDate <= :today', { today })
      .getCount();
  }

  private countActiveCertificates(companyId: number) {
    return this.employeeCertificateRepository.count({
      where: { companyId, isActive: true },
    });
  }

  private countExpiringCertificates(
    companyId: number,
    today: string,
    expiryDateTo: string,
  ) {
    return this.employeeCertificateRepository
      .createQueryBuilder('certificate')
      .where('certificate.companyId = :companyId', { companyId })
      .andWhere('certificate.isActive = :isActive', { isActive: true })
      .andWhere('certificate.expiredDate IS NOT NULL')
      .andWhere('certificate.expiredDate >= :today', { today })
      .andWhere('certificate.expiredDate <= :expiryDateTo', { expiryDateTo })
      .getCount();
  }

  private countExpiredCertificates(companyId: number, today: string) {
    return this.employeeCertificateRepository
      .createQueryBuilder('certificate')
      .where('certificate.companyId = :companyId', { companyId })
      .andWhere('certificate.isActive = :isActive', { isActive: true })
      .andWhere('certificate.expiredDate IS NOT NULL')
      .andWhere('certificate.expiredDate < :today', { today })
      .getCount();
  }

  private async getDepartmentHeadcounts(companyId: number, today: string) {
    const departmentExpression =
      "COALESCE(department.departmentName, NULLIF(TRIM(employee.departmentName), ''), '미지정')";
    const rows = await this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoin('employee.department', 'department')
      .select(departmentExpression, 'departmentName')
      .addSelect('COUNT(*)', 'totalCount')
      .addSelect(
        `SUM(CASE WHEN employee.isActive = 1 AND (employee.resignDate IS NULL OR employee.resignDate > :today) THEN 1 ELSE 0 END)`,
        'activeCount',
      )
      .addSelect(
        `SUM(CASE WHEN employee.resignDate IS NOT NULL AND employee.resignDate <= :today THEN 1 ELSE 0 END)`,
        'resignedCount',
      )
      .where('employee.companyId = :companyId', { companyId })
      .setParameter('today', today)
      .groupBy(departmentExpression)
      .orderBy('totalCount', 'DESC')
      .addOrderBy('departmentName', 'ASC')
      .limit(10)
      .getRawMany<DepartmentHeadcountRaw>();

    return rows.map((row) => ({
      departmentName: row.departmentName ?? '미지정',
      totalCount: this.toNumber(row.totalCount),
      activeCount: this.toNumber(row.activeCount),
      resignedCount: this.toNumber(row.resignedCount),
    }));
  }

  private async getCertificateExpiryItems(
    companyId: number,
    today: string,
    expiryDateTo: string,
  ) {
    const certificates = await this.employeeCertificateRepository
      .createQueryBuilder('certificate')
      .leftJoinAndSelect('certificate.employee', 'employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.position', 'position')
      .leftJoinAndSelect('certificate.certificateType', 'certificateType')
      .where('certificate.companyId = :companyId', { companyId })
      .andWhere('certificate.isActive = :isActive', { isActive: true })
      .andWhere('certificate.expiredDate IS NOT NULL')
      .andWhere('certificate.expiredDate <= :expiryDateTo', { expiryDateTo })
      .orderBy('certificate.expiredDate', 'DESC')
      .take(100)
      .getMany();

    return certificates
      .map((item) => {
        const daysUntilExpiry = item.expiredDate
          ? this.daysBetween(today, item.expiredDate)
          : null;
        return {
          id: item.id,
          employeeId: item.employeeId,
          employeeCode: item.employee?.employeeCode ?? '',
          employeeName: item.employee?.employeeName ?? '',
          departmentName:
            item.employee?.department?.departmentName ??
            item.employee?.departmentName ??
            null,
          positionName:
            item.employee?.position?.positionName ??
            item.employee?.positionName ??
            null,
          certificateTypeId: item.certificateTypeId,
          certificateTypeName: item.certificateType?.certificateTypeName ?? '',
          certificateNo: item.certificateNo ?? null,
          expiredDate: item.expiredDate ?? null,
          daysUntilExpiry,
          status:
            daysUntilExpiry !== null && daysUntilExpiry < 0
              ? 'expired'
              : 'expiring',
        };
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'expired' ? -1 : 1;
        if (a.daysUntilExpiry === null) return 1;
        if (b.daysUntilExpiry === null) return -1;
        return a.status === 'expired'
          ? b.daysUntilExpiry - a.daysUntilExpiry
          : a.daysUntilExpiry - b.daysUntilExpiry;
      })
      .slice(0, 10);
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private toDateString(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private daysBetween(from: string, to: string) {
    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T00:00:00`);
    return Math.round(
      (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000),
    );
  }

  private toNumber(value: string | number | null | undefined) {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
  }
}
