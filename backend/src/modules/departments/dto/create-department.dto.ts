import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  departmentCode?: string;

  @IsString()
  @MaxLength(120)
  departmentName: string;

  @IsOptional()
  @IsInt()
  businessUnitId?: number;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
