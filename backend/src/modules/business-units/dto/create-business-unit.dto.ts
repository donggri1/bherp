import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBusinessUnitDto {
  @IsString()
  @MaxLength(50)
  businessUnitCode: string;

  @IsString()
  @MaxLength(120)
  businessUnitName: string;

  @IsInt()
  businessRegistrationId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
