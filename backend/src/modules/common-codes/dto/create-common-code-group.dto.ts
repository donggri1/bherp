import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommonCodeGroupDto {
  @IsString()
  @MaxLength(80)
  groupCode: string;

  @IsString()
  @MaxLength(100)
  groupName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
