import { CommonCode } from './entities/common-code.entity';
import { CommonCodeGroup } from './entities/common-code-group.entity';

export const commonCodeGroupSeeds: Partial<CommonCodeGroup>[] = [
  { groupCode: 'USER_STATUS', groupName: '사용자상태', isSystem: true },
  { groupCode: 'EMPLOYEE_STATUS', groupName: '사원상태', isSystem: true },
  { groupCode: 'USE_YN', groupName: '사용여부', isSystem: true },
  { groupCode: 'BUSINESS_TYPE', groupName: '사업장유형', isSystem: true },
];

export const commonCodeSeeds: Partial<CommonCode>[] = [
  { groupCode: 'USER_STATUS', code: 'ACTIVE', codeName: '사용', sortOrder: 1, isSystem: true },
  { groupCode: 'USER_STATUS', code: 'INACTIVE', codeName: '미사용', sortOrder: 2, isSystem: true },
  { groupCode: 'USER_STATUS', code: 'LOCKED', codeName: '잠김', sortOrder: 3, isSystem: true },
  { groupCode: 'EMPLOYEE_STATUS', code: 'WORKING', codeName: '재직', sortOrder: 1, isSystem: true },
  { groupCode: 'EMPLOYEE_STATUS', code: 'RESIGNED', codeName: '퇴사', sortOrder: 2, isSystem: true },
  { groupCode: 'USE_YN', code: 'Y', codeName: '사용', sortOrder: 1, isSystem: true },
  { groupCode: 'USE_YN', code: 'N', codeName: '미사용', sortOrder: 2, isSystem: true },
  { groupCode: 'BUSINESS_TYPE', code: 'HEAD_OFFICE', codeName: '본사', sortOrder: 1, isSystem: true },
  { groupCode: 'BUSINESS_TYPE', code: 'BRANCH', codeName: '지점', sortOrder: 2, isSystem: true },
  { groupCode: 'BUSINESS_TYPE', code: 'FACTORY', codeName: '공장', sortOrder: 3, isSystem: true },
];
