import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePositionDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  positionCode?: string;

  @IsString()
  @MaxLength(120)
  positionName: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
