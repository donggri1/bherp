import { Type } from 'class-transformer';
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

export const PROJECT_SITE_STATUS_VALUES = [
  'planned',
  'in_progress',
  'completed',
  'on_hold',
  'cancelled',
] as const;

export class CreateProjectSiteDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  siteCode?: string;

  @Type(() => Number)
  @IsInt()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  siteName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  siteAddress?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  managerName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  managerPhone?: string | null;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsIn(PROJECT_SITE_STATUS_VALUES)
  siteStatus?: string;

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
