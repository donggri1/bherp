import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCertificateTypeDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  certificateTypeCode?: string;

  @IsString()
  @MaxLength(120)
  certificateTypeName: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  issuer?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
