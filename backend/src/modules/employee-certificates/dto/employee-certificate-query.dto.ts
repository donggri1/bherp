import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class EmployeeCertificateQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employeeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  certificateTypeId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const values = Array.isArray(value) ? value : String(value).split(',');
    return values.map((item) => Number(item)).filter(Number.isFinite);
  })
  @IsArray()
  @IsInt({ each: true })
  certificateTypeIds?: number[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  expiredDateFrom?: string;

  @IsOptional()
  @IsDateString()
  expiredDateTo?: string;
}
