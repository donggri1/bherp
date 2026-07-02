import { PartialType } from '@nestjs/mapped-types';
import { CreateSequenceRuleDto } from './create-sequence-rule.dto';

export class UpdateSequenceRuleDto extends PartialType(CreateSequenceRuleDto) {}
