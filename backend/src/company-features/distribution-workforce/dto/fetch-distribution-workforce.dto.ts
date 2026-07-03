import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';
import { BulkDistributionWorkforceDto } from './bulk-distribution-workforce.dto';

const normalizeDate = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8) return value;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

export class FetchDistributionWorkforceDto extends BulkDistributionWorkforceDto {
  @Transform(normalizeDate)
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
  periodFrom: string;

  @Transform(normalizeDate)
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
  periodTo: string;
}
