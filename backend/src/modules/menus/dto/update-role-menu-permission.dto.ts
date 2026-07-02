import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class UpdateRoleMenuPermissionDto {
  @IsInt()
  roleId: number;

  @IsInt()
  menuId: number;

  @IsOptional()
  @IsBoolean()
  canRead?: boolean;

  @IsOptional()
  @IsBoolean()
  canCreate?: boolean;

  @IsOptional()
  @IsBoolean()
  canUpdate?: boolean;

  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;

  @IsOptional()
  @IsBoolean()
  canExcel?: boolean;
}
