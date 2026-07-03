import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkDistributionWorkforceDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @Type(() => Number)
  @IsInt({ each: true })
  employeeIds: number[];
}
