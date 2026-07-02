import { PartialType } from '@nestjs/mapped-types';
import { CreateCertificateTypeDto } from './create-certificate-type.dto';

export class UpdateCertificateTypeDto extends PartialType(CreateCertificateTypeDto) {}
