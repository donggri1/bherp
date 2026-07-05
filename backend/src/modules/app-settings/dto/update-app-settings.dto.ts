import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class CertificateExpiryAlertRuleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount: number;

  @IsIn(['hour', 'day'])
  unit: 'hour' | 'day';
}

export class UpdateAppSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificateExpiryAlertRuleDto)
  certificateExpiryAlertRules: CertificateExpiryAlertRuleDto[];

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  certificateExpiryAlertRoleIds?: number[];
}
