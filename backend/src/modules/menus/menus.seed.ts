import { Menu } from './entities/menu.entity';

const distributionWorkforceEnabled = process.env.FEATURE_DISTRIBUTION_WORKFORCE !== 'false';
const sungwonTaxInvoiceConverterEnabled =
  process.env.FEATURE_SUNGWON_TAX_INVOICE_CONVERTER !== 'false';

export const initialMenus: Partial<Menu>[] = [
  {
    menuCode: 'OP_BUSINESS_REGISTRATION',
    menuName: '사업자등록',
    menuGroupCode: 'MASTER_DATA',
    path: '/operation/business-registration',
    sortOrder: 1,
  },
  {
    menuCode: 'OP_BUSINESS_UNIT',
    menuName: '사업단위등록',
    menuGroupCode: 'MASTER_DATA',
    path: '/operation/business-unit',
    sortOrder: 2,
  },
  {
    menuCode: 'OP_DEPARTMENTS',
    menuName: '부서등록',
    menuGroupCode: 'MASTER_DATA',
    path: '/operation/departments',
    sortOrder: 3,
  },
  {
    menuCode: 'OP_POSITIONS',
    menuName: '직위등록',
    menuGroupCode: 'MASTER_DATA',
    path: '/operation/positions',
    sortOrder: 4,
  },
  {
    menuCode: 'OP_CERTIFICATE_TYPES',
    menuName: '자격증종류등록',
    menuGroupCode: 'MASTER_DATA',
    path: '/operation/certificate-types',
    sortOrder: 5,
  },
  {
    menuCode: 'OP_HR_DASHBOARD',
    menuName: '인사현황',
    menuGroupCode: 'HR_CERTIFICATE',
    path: '/operation/hr-dashboard',
    sortOrder: 1,
  },
  {
    menuCode: 'OP_EMPLOYEES',
    menuName: '사원등록',
    menuGroupCode: 'HR_CERTIFICATE',
    path: '/operation/employees',
    sortOrder: 2,
  },
  {
    menuCode: 'OP_ORGANIZATION_CHART',
    menuName: '부서조직도',
    menuGroupCode: 'HR_CERTIFICATE',
    path: '/operation/organization-chart',
    sortOrder: 3,
  },
  {
    menuCode: 'OP_EMPLOYEE_CERTIFICATES',
    menuName: '사원별자격증등록',
    menuGroupCode: 'HR_CERTIFICATE',
    path: '/operation/employee-certificates',
    sortOrder: 4,
  },
  {
    menuCode: 'OP_EMPLOYEE_CERTIFICATE_INQUIRY',
    menuName: '사원자격증조회',
    menuGroupCode: 'HR_CERTIFICATE',
    path: '/operation/employee-certificate-inquiry',
    sortOrder: 5,
  },
  {
    menuCode: 'OP_CERTIFICATE_EXPIRY_STATUS',
    menuName: '자격만료현황',
    menuGroupCode: 'HR_CERTIFICATE',
    path: '/operation/certificate-expiry-status',
    sortOrder: 6,
  },
  {
    menuCode: 'OP_PROJECTS',
    menuName: '프로젝트등록',
    menuGroupCode: 'PROJECT_FIELD',
    path: '/operation/projects',
    sortOrder: 1,
  },
  {
    menuCode: 'OP_PROJECT_SITES',
    menuName: '현장정보관리',
    menuGroupCode: 'PROJECT_FIELD',
    path: '/operation/project-sites',
    sortOrder: 2,
  },
  {
    menuCode: 'OP_PROJECT_ASSIGNMENTS',
    menuName: '현장인력배치',
    menuGroupCode: 'PROJECT_FIELD',
    path: '/operation/project-assignments',
    sortOrder: 3,
  },
  ...(distributionWorkforceEnabled
    ? [
        {
          menuCode: 'OP_DISTRIBUTION_WORKFORCE',
          menuName: '배전인력',
          menuGroupCode: 'PROJECT_FIELD',
          path: '/operation/distribution-workforce',
          sortOrder: 4,
        },
      ]
    : []),
  ...(sungwonTaxInvoiceConverterEnabled
    ? [
        {
          menuCode: 'OP_SUNGWON_TAX_INVOICE_CONVERTER',
          menuName: '세금계산서변환',
          menuGroupCode: 'ACCOUNTING_TAX',
          path: '/operation/sungwon-tax-invoice-converter',
          sortOrder: 1,
        },
      ]
    : []),
  {
    menuCode: 'OP_USERS',
    menuName: '사용자등록',
    menuGroupCode: 'SYSTEM',
    path: '/operation/users',
    sortOrder: 1,
  },
  {
    menuCode: 'OP_PERMISSIONS',
    menuName: '권한등록',
    menuGroupCode: 'SYSTEM',
    path: '/operation/permissions',
    sortOrder: 2,
  },
  {
    menuCode: 'OP_ADMIN_SETTINGS',
    menuName: '환경설정',
    menuGroupCode: 'SYSTEM',
    path: '/operation/admin-settings',
    sortOrder: 3,
  },
];
