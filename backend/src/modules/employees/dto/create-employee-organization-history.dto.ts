import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEmployeeOrganizationHistoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  businessUnitId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  positionId?: number | null;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  changeReason?: string | null;
}
