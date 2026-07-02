import { IsString, MaxLength } from 'class-validator';

export class IssueSequenceDto {
  @IsString()
  @MaxLength(50)
  targetType: string;
}
