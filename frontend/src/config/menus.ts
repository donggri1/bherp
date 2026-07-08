import type { MenuGroup, MenuItem, MenuNode } from "@/types/menu";

const distributionWorkforceEnabled =
  process.env.NEXT_PUBLIC_FEATURE_DISTRIBUTION_WORKFORCE !== "false";
const sungwonTaxInvoiceConverterEnabled =
  process.env.NEXT_PUBLIC_FEATURE_SUNGWON_TAX_INVOICE_CONVERTER !== "false";

export const menuGroups: MenuGroup[] = [
  {
    menuGroupCode: "MASTER_DATA",
    moduleCode: "MASTER_DATA",
    title: "기준정보",
    menus: [
      {
        menuCode: "MASTER_COMPANY",
        moduleCode: "MASTER_DATA",
        title: "회사/사업장",
        children: [
          {
            menuCode: "OP_BUSINESS_REGISTRATION",
            moduleCode: "MASTER_DATA",
            title: "사업자등록",
            path: "/operation/business-registration",
          },
          {
            menuCode: "OP_BUSINESS_UNIT",
            moduleCode: "MASTER_DATA",
            title: "사업단위등록",
            path: "/operation/business-unit",
          },
        ],
      },
      {
        menuCode: "MASTER_ORG_HR",
        moduleCode: "MASTER_DATA",
        title: "조직/인사 기준",
        children: [
          {
            menuCode: "OP_DEPARTMENTS",
            moduleCode: "MASTER_DATA",
            title: "부서등록",
            path: "/operation/departments",
          },
          {
            menuCode: "OP_POSITIONS",
            moduleCode: "MASTER_DATA",
            title: "직위등록",
            path: "/operation/positions",
          },
          {
            menuCode: "OP_CERTIFICATE_TYPES",
            moduleCode: "MASTER_DATA",
            title: "자격증종류등록",
            path: "/operation/certificate-types",
          },
        ],
      },
    ],
  },
  {
    menuGroupCode: "HR_CERTIFICATE",
    moduleCode: "HR",
    title: "인사/자격",
    menus: [
      {
        menuCode: "HR_EMPLOYEE_MANAGEMENT",
        moduleCode: "HR",
        title: "사원관리",
        children: [
          {
            menuCode: "OP_HR_DASHBOARD",
            moduleCode: "HR",
            title: "인사현황",
            path: "/operation/hr-dashboard",
          },
          {
            menuCode: "OP_EMPLOYEES",
            moduleCode: "HR",
            title: "사원등록",
            path: "/operation/employees",
          },
          {
            menuCode: "OP_ORGANIZATION_CHART",
            moduleCode: "HR",
            title: "부서조직도",
            path: "/operation/organization-chart",
          },
        ],
      },
      {
        menuCode: "HR_CERTIFICATE_MANAGEMENT",
        moduleCode: "HR",
        title: "자격관리",
        children: [
          {
            menuCode: "OP_EMPLOYEE_CERTIFICATES",
            moduleCode: "HR",
            title: "사원별자격증등록",
            path: "/operation/employee-certificates",
          },
          {
            menuCode: "OP_EMPLOYEE_CERTIFICATE_INQUIRY",
            moduleCode: "HR",
            title: "사원자격증조회",
            path: "/operation/employee-certificate-inquiry",
          },
          {
            menuCode: "OP_CERTIFICATE_EXPIRY_STATUS",
            moduleCode: "HR",
            title: "자격만료현황",
            path: "/operation/certificate-expiry-status",
          },
        ],
      },
    ],
  },
  {
    menuGroupCode: "PROJECT_FIELD",
    moduleCode: "PROJECT",
    title: "프로젝트/현장",
    menus: [
      {
        menuCode: "PROJECT_CORE",
        moduleCode: "PROJECT",
        title: "프로젝트",
        children: [
          {
            menuCode: "OP_PROJECTS",
            moduleCode: "PROJECT",
            title: "프로젝트등록",
            path: "/operation/projects",
          },
          {
            menuCode: "OP_PROJECT_SITES",
            moduleCode: "PROJECT",
            title: "현장정보관리",
            path: "/operation/project-sites",
          },
          {
            menuCode: "OP_PROJECT_ASSIGNMENTS",
            moduleCode: "PROJECT",
            title: "현장인력배치",
            path: "/operation/project-assignments",
          },
        ],
      },
      ...(distributionWorkforceEnabled
        ? [
            {
              menuCode: "PROJECT_DISTRIBUTION",
              moduleCode: "PROJECT",
              title: "배전업무",
              children: [
                {
                  menuCode: "OP_DISTRIBUTION_WORKFORCE",
                  moduleCode: "PROJECT",
                  title: "배전인력",
                  path: "/operation/distribution-workforce",
                },
              ],
            },
          ]
        : []),
    ],
  },
  {
    menuGroupCode: "ACCOUNTING_TAX",
    moduleCode: "ACCOUNTING",
    title: "세무/회계",
    menus: [
      ...(sungwonTaxInvoiceConverterEnabled
        ? [
            {
              menuCode: "ACCOUNTING_TAX_INVOICE",
              moduleCode: "ACCOUNTING",
              title: "세금계산서",
              children: [
                {
                  menuCode: "OP_SUNGWON_TAX_INVOICE_CONVERTER",
                  moduleCode: "ACCOUNTING",
                  title: "세금계산서변환",
                  path: "/operation/sungwon-tax-invoice-converter",
                },
              ],
            },
          ]
        : []),
    ],
  },
  {
    menuGroupCode: "SYSTEM",
    moduleCode: "SYSTEM",
    title: "시스템",
    menus: [
      {
        menuCode: "SYSTEM_SECURITY",
        moduleCode: "SYSTEM",
        title: "보안",
        children: [
          {
            menuCode: "OP_USERS",
            moduleCode: "SYSTEM",
            title: "사용자등록",
            path: "/operation/users",
          },
          {
            menuCode: "OP_PERMISSIONS",
            moduleCode: "SYSTEM",
            title: "권한등록",
            path: "/operation/permissions",
          },
        ],
      },
      {
        menuCode: "SYSTEM_SETTINGS",
        moduleCode: "SYSTEM",
        title: "설정",
        children: [
          {
            menuCode: "OP_ADMIN_SETTINGS",
            moduleCode: "SYSTEM",
            title: "환경설정",
            path: "/operation/admin-settings",
          },
        ],
      },
    ],
  },
];

function isMenuItem(node: MenuNode): node is MenuItem {
  return Boolean(node.path);
}

function collectLeafMenuItems(nodes: MenuNode[]): MenuItem[] {
  return nodes.flatMap((node) => [
    ...(isMenuItem(node) ? [node] : []),
    ...(node.children ? collectLeafMenuItems(node.children) : []),
  ]);
}

export function getLeafMenuItems(groups: MenuGroup[] = menuGroups): MenuItem[] {
  return groups.flatMap((group) => collectLeafMenuItems(group.menus));
}
