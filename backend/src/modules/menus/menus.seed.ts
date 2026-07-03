import { Menu } from './entities/menu.entity';

const distributionWorkforceEnabled = process.env.FEATURE_DISTRIBUTION_WORKFORCE !== 'false';

export const initialMenus: Partial<Menu>[] = [
  {
    menuCode: 'OP_BUSINESS_REGISTRATION',
    menuName: '사업자등록',
    menuGroupCode: 'OPERATION',
    path: '/operation/business-registration',
    sortOrder: 1,
  },
  {
    menuCode: 'OP_BUSINESS_UNIT',
    menuName: '사업단위등록',
    menuGroupCode: 'OPERATION',
    path: '/operation/business-unit',
    sortOrder: 2,
  },
  {
    menuCode: 'OP_DEPARTMENTS',
    menuName: '부서등록',
    menuGroupCode: 'OPERATION',
    path: '/operation/departments',
    sortOrder: 3,
  },
  {
    menuCode: 'OP_POSITIONS',
    menuName: '직위등록',
    menuGroupCode: 'OPERATION',
    path: '/operation/positions',
    sortOrder: 4,
  },
  {
    menuCode: 'OP_USERS',
    menuName: '사용자등록',
    menuGroupCode: 'OPERATION',
    path: '/operation/users',
    sortOrder: 5,
  },
  {
    menuCode: 'OP_EMPLOYEES',
    menuName: '사원등록',
    menuGroupCode: 'OPERATION',
    path: '/operation/employees',
    sortOrder: 6,
  },
  {
    menuCode: 'OP_CERTIFICATE_TYPES',
    menuName: '자격증종류등록',
    menuGroupCode: 'OPERATION',
    path: '/operation/certificate-types',
    sortOrder: 7,
  },
  {
    menuCode: 'OP_EMPLOYEE_CERTIFICATES',
    menuName: '사원별자격증등록',
    menuGroupCode: 'OPERATION',
    path: '/operation/employee-certificates',
    sortOrder: 8,
  },
  {
    menuCode: 'OP_EMPLOYEE_CERTIFICATE_INQUIRY',
    menuName: '사원자격증조회',
    menuGroupCode: 'OPERATION',
    path: '/operation/employee-certificate-inquiry',
    sortOrder: 9,
  },
  ...(distributionWorkforceEnabled
    ? [
        {
          menuCode: 'OP_DISTRIBUTION_WORKFORCE',
          menuName: '배전인력',
          menuGroupCode: 'OPERATION',
          path: '/operation/distribution-workforce',
          sortOrder: 10,
        },
      ]
    : []),
  {
    menuCode: 'OP_PERMISSIONS',
    menuName: '권한등록',
    menuGroupCode: 'OPERATION',
    path: '/operation/permissions',
    sortOrder: 11,
  },
  {
    menuCode: 'OP_ADMIN_SETTINGS',
    menuName: '환경설정',
    menuGroupCode: 'OPERATION',
    path: '/operation/admin-settings',
    sortOrder: 12,
  },
];
