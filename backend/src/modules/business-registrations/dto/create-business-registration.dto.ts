import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBusinessRegistrationDto {
  @IsString()
  @MaxLength(50)
  businessCode: string;

  @IsString()
  @MaxLength(120)
  businessName: string;

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
  @MaxLength(80)
  businessType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  businessItem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  zipCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  detailAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  tel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  fax?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
