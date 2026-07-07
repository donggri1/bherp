import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeCode?: string;

  @IsString()
  @MaxLength(100)
  employeeName: string;

  @IsOptional()
  @IsInt()
  userId?: number | null;

  @IsOptional()
  @IsInt()
  businessUnitId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  departmentName?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  positionId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  positionName?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  residentRegistrationNumber?: string | null;

  @IsOptional()
  @IsString()
  hireDate?: string | null;

  @IsOptional()
  @IsString()
  resignDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
