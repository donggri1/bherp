import type { MenuGroup } from "@/types/menu";

const distributionWorkforceEnabled =
  process.env.NEXT_PUBLIC_FEATURE_DISTRIBUTION_WORKFORCE !== "false";

export const menuGroups: MenuGroup[] = [
  {
    menuGroupCode: "OPERATION",
    title: "운영",
    menus: [
      {
        menuCode: "OP_BUSINESS_REGISTRATION",
        title: "사업자등록",
        path: "/operation/business-registration",
      },
      {
        menuCode: "OP_BUSINESS_UNIT",
        title: "사업단위등록",
        path: "/operation/business-unit",
      },
      {
        menuCode: "OP_DEPARTMENTS",
        title: "부서등록",
        path: "/operation/departments",
      },
      {
        menuCode: "OP_POSITIONS",
        title: "직위등록",
        path: "/operation/positions",
      },
      {
        menuCode: "OP_USERS",
        title: "사용자등록",
        path: "/operation/users",
      },
      {
        menuCode: "OP_EMPLOYEES",
        title: "사원등록",
        path: "/operation/employees",
      },
      {
        menuCode: "OP_CERTIFICATE_TYPES",
        title: "자격증종류등록",
        path: "/operation/certificate-types",
      },
      {
        menuCode: "OP_EMPLOYEE_CERTIFICATES",
        title: "사원별자격증등록",
        path: "/operation/employee-certificates",
      },
      {
        menuCode: "OP_EMPLOYEE_CERTIFICATE_INQUIRY",
        title: "사원자격증조회",
        path: "/operation/employee-certificate-inquiry",
      },
      ...(distributionWorkforceEnabled
        ? [
            {
              menuCode: "OP_DISTRIBUTION_WORKFORCE",
              title: "배전인력",
              path: "/operation/distribution-workforce",
            },
          ]
        : []),
      {
        menuCode: "OP_PERMISSIONS",
        title: "권한등록",
        path: "/operation/permissions",
      },
      {
        menuCode: "OP_ADMIN_SETTINGS",
        title: "환경설정",
        path: "/operation/admin-settings",
      },
    ],
  },
];
