import {
  IsBoolean,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEmployeeCertificateDto {
  @IsInt()
  employeeId: number;

  @IsInt()
  certificateTypeId: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  certificateNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  issuer?: string;

  @IsOptional()
  @IsString()
  acquiredDate?: string;

  @IsOptional()
  @IsString()
  renewedDate?: string;

  @IsOptional()
  @IsString()
  expiredDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  qualificationStatus?: string;

  @IsOptional()
  @IsNumberString()
  workHours?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
