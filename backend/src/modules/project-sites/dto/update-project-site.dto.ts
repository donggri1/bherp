import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectSiteDto } from './create-project-site.dto';

export class UpdateProjectSiteDto extends PartialType(CreateProjectSiteDto) {}
