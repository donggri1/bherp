import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
};

export class DistributionWorkforceQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  departmentName?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  hasBaseCertificate?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  hasBaseCertificateNo?: boolean;
}
