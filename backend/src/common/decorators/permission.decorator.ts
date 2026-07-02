import { SetMetadata } from '@nestjs/common';

export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'excel';

export const PERMISSION_KEY = 'permission';
export const Permission = (permission: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, permission);
