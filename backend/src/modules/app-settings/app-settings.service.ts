import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { CertificateType } from '../certificate-types/entities/certificate-type.entity';
import { EmployeeCertificate } from '../employee-certificates/entities/employee-certificate.entity';
import { Employee } from '../employees/entities/employee.entity';
import { CertificateExpiryAlertRuleDto, UpdateAppSettingsDto } from './dto/update-app-settings.dto';
import { AppSetting } from './entities/app-setting.entity';

const CERTIFICATE_EXPIRY_ALERT_RULES_KEY = 'CERTIFICATE_EXPIRY_ALERT_RULES';

const defaultCertificateExpiryAlertRules: CertificateExpiryAlertRuleDto[] = [
  { amount: 1, unit: 'hour' },
  { amount: 2, unit: 'day' },
  { amount: 7, unit: 'day' },
];

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ruleToMilliseconds(rule: CertificateExpiryAlertRuleDto) {
  return rule.amount * (rule.unit === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
}

function ruleLabel(rule: CertificateExpiryAlertRuleDto) {
  return `${rule.amount}${rule.unit === 'hour' ? '시간' : '일'} 전`;
}

@Injectable()
export class AppSettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly repository: Repository<AppSetting>,
    @InjectRepository(EmployeeCertificate)
    private readonly employeeCertificateRepository: Repository<EmployeeCertificate>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(CertificateType)
    private readonly certificateTypeRepository: Repository<CertificateType>,
  ) {}

  async getSettings(companyId: number) {
    return {
      certificateExpiryAlertRules: await this.getCertificateExpiryAlertRules(companyId),
    };
  }

  async updateSettings(companyId: number, dto: UpdateAppSettingsDto) {
    await this.upsertSetting(
      companyId,
      CERTIFICATE_EXPIRY_ALERT_RULES_KEY,
      this.normalizeRules(dto.certificateExpiryAlertRules),
    );
    return this.getSettings(companyId);
  }

  async getCertificateExpiryAlerts(companyId: number) {
    const rules = await this.getCertificateExpiryAlertRules(companyId);
    if (!rules.length) return [];

    const sortedRules = [...rules].sort((a, b) => ruleToMilliseconds(a) - ruleToMilliseconds(b));
    const maxRuleMs = Math.max(...sortedRules.map(ruleToMilliseconds));
    const now = new Date();
    const maxDate = new Date(now.getTime() + maxRuleMs);

    const certificates = await this.employeeCertificateRepository.find({
      where: {
        companyId,
        isActive: true,
        expiredDate: LessThanOrEqual(toDateString(maxDate)),
      },
      order: { expiredDate: 'ASC', id: 'DESC' },
      take: 50,
    });

    const today = toDateString(now);
    const activeCertificates = certificates.filter(
      (item) => item.expiredDate && item.expiredDate >= today,
    );
    const employeeIds = [...new Set(activeCertificates.map((item) => item.employeeId))];
    const certificateTypeIds = [...new Set(activeCertificates.map((item) => item.certificateTypeId))];
    const [employees, certificateTypes] = await Promise.all([
      employeeIds.length
        ? this.employeeRepository.find({
            where: employeeIds.map((id) => ({ id, companyId, isActive: true })),
          })
        : [],
      certificateTypeIds.length
        ? this.certificateTypeRepository.find({
            where: certificateTypeIds.map((id) => ({ id, companyId, isActive: true })),
          })
        : [],
    ]);

    const employeeMap = new Map<number, Employee>(
      employees.map((item) => [item.id, item] as [number, Employee]),
    );
    const certificateTypeMap = new Map<number, CertificateType>(
      certificateTypes.map((item) => [item.id, item] as [number, CertificateType]),
    );

    return activeCertificates
      .map((item) => {
        const expiredAt = new Date(`${item.expiredDate}T23:59:59`);
        const remainingMs = Math.max(0, expiredAt.getTime() - now.getTime());
        const matchedRule = sortedRules.find((rule) => remainingMs <= ruleToMilliseconds(rule));
        if (!matchedRule) return null;

        const employee = employeeMap.get(item.employeeId);
        const certificateType = certificateTypeMap.get(item.certificateTypeId);
        if (!employee || !certificateType) return null;

        return {
          id: item.id,
          employeeId: item.employeeId,
          employeeCode: employee.employeeCode,
          employeeName: employee.employeeName,
          departmentName: employee.departmentName,
          positionName: employee.positionName,
          certificateTypeId: item.certificateTypeId,
          certificateTypeName: certificateType.certificateTypeName,
          certificateNo: item.certificateNo,
          expiredDate: item.expiredDate,
          alertRuleLabel: ruleLabel(matchedRule),
        };
      })
      .filter(Boolean);
  }

  private async getCertificateExpiryAlertRules(companyId: number) {
    const setting = await this.repository.findOne({
      where: { companyId, settingKey: CERTIFICATE_EXPIRY_ALERT_RULES_KEY },
    });
    if (!setting) return defaultCertificateExpiryAlertRules;
    return this.normalizeRules(setting.settingValue as CertificateExpiryAlertRuleDto[]);
  }

  private normalizeRules(rules: CertificateExpiryAlertRuleDto[]) {
    const ruleMap = new Map<string, CertificateExpiryAlertRuleDto>();
    for (const rule of rules) {
      if (!rule.amount || rule.amount < 1) continue;
      const normalized = { amount: Number(rule.amount), unit: rule.unit };
      ruleMap.set(`${normalized.amount}:${normalized.unit}`, normalized);
    }
    return [...ruleMap.values()].sort((a, b) => ruleToMilliseconds(a) - ruleToMilliseconds(b));
  }

  private async upsertSetting(companyId: number, settingKey: string, settingValue: unknown) {
    const setting = await this.repository.findOne({ where: { companyId, settingKey } });
    if (setting) {
      setting.settingValue = settingValue;
      return this.repository.save(setting);
    }
    return this.repository.save(this.repository.create({ companyId, settingKey, settingValue }));
  }
}
