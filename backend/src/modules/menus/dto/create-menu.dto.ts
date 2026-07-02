import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @MaxLength(80)
  menuCode: string;

  @IsString()
  @MaxLength(100)
  menuName: string;

  @IsString()
  @MaxLength(50)
  menuGroupCode: string;

  @IsString()
  @MaxLength(180)
  path: string;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
