export type CertificateExpiryAlertRule = {
  amount: number;
  unit: "hour" | "day";
};

export type AdminSettings = {
  certificateExpiryAlertRules: CertificateExpiryAlertRule[];
  certificateExpiryAlertRoleIds: number[];
};

export type CertificateExpiryAlert = {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  departmentName?: string;
  positionName?: string;
  certificateTypeId: number;
  certificateTypeName: string;
  certificateNo?: string;
  expiredDate: string;
  alertRuleLabel: string;
};
