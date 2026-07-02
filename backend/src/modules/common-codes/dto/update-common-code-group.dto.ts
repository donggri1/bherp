import { PartialType } from '@nestjs/mapped-types';
import { CreateCommonCodeGroupDto } from './create-common-code-group.dto';

export class UpdateCommonCodeGroupDto extends PartialType(CreateCommonCodeGroupDto) {}
