import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const PROJECT_STATUS_VALUES = [
  'planned',
  'in_progress',
  'completed',
  'on_hold',
  'cancelled',
] as const;

export class CreateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  projectCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  constructionNo?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  projectName: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  clientName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  siteAddress?: string | null;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsIn(PROJECT_STATUS_VALUES)
  projectStatus?: string;

  @IsOptional()
  @IsString()
  memo?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
