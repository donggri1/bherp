import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MaxLength(50)
  companyCode: string;

  @IsString()
  @MaxLength(100)
  companyName: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  businessNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ceoName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  tel?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
