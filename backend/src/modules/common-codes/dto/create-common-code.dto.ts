import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommonCodeDto {
  @IsString()
  @MaxLength(80)
  groupCode: string;

  @IsString()
  @MaxLength(80)
  code: string;

  @IsString()
  @MaxLength(100)
  codeName: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  value1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  value2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  value3?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
