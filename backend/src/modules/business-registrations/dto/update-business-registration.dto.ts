import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessRegistrationDto } from './create-business-registration.dto';

export class UpdateBusinessRegistrationDto extends PartialType(CreateBusinessRegistrationDto) {}
