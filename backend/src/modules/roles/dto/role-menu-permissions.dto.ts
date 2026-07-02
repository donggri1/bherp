import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, ValidateNested } from 'class-validator';

export class RoleMenuPermissionItemDto {
  @IsInt()
  menuId: number;

  @IsBoolean()
  canRead: boolean;

  @IsBoolean()
  canCreate: boolean;

  @IsBoolean()
  canUpdate: boolean;

  @IsBoolean()
  canDelete: boolean;

  @IsBoolean()
  canExcel: boolean;
}

export class SaveRoleMenuPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleMenuPermissionItemDto)
  permissions: RoleMenuPermissionItemDto[];
}
