import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeCertificateDto } from './create-employee-certificate.dto';

export class UpdateEmployeeCertificateDto extends PartialType(CreateEmployeeCertificateDto) {}
