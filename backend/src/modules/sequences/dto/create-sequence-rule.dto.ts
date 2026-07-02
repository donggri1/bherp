import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSequenceRuleDto {
  @IsString()
  @MaxLength(50)
  targetType: string;

  @IsString()
  @MaxLength(30)
  prefix: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  dateFormat?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  currentLength?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  separator?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  resetCycle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  example?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
