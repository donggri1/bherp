import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const PROJECT_ASSIGNMENT_STATUS_VALUES = [
  'planned',
  'assigned',
  'completed',
  'cancelled',
] as const;

export class CreateProjectAssignmentDto {
  @Type(() => Number)
  @IsInt()
  projectId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  projectSiteId?: number | null;

  @Type(() => Number)
  @IsInt()
  employeeId: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  assignmentRole?: string | null;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsIn(PROJECT_ASSIGNMENT_STATUS_VALUES)
  assignmentStatus?: string;

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
