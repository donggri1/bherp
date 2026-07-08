import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { MenuCode } from '../../common/decorators/menu-code.decorator';
import { Permission } from '../../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { CreateProjectSiteDto } from './dto/create-project-site.dto';
import { ProjectSiteQueryDto } from './dto/project-site-query.dto';
import { UpdateProjectSiteDto } from './dto/update-project-site.dto';
import { ProjectSitesService } from './project-sites.service';

@Controller('project-sites')
@UseGuards(JwtAuthGuard, MenuPermissionGuard)
@MenuCode('OP_PROJECT_SITES')
export class ProjectSitesController {
  constructor(private readonly service: ProjectSitesService) {}

  @Get()
  @Permission('read')
  findAll(@CompanyId() companyId: number, @Query() query: ProjectSiteQueryDto) {
    return this.service.findAll(companyId, query);
  }

  @Get(':id')
  @Permission('read')
  findOne(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.service.findOne(companyId, Number(id));
  }

  @Post()
  @Permission('create')
  create(@CompanyId() companyId: number, @Body() dto: CreateProjectSiteDto) {
    return this.service.create(companyId, dto);
  }

  @Patch(':id')
  @Permission('update')
  update(
    @CompanyId() companyId: number,
    @Param('id') id: string,
    @Body() dto: UpdateProjectSiteDto,
  ) {
    return this.service.update(companyId, Number(id), dto);
  }

  @Delete(':id')
  @Permission('delete')
  remove(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.service.remove(companyId, Number(id));
  }
}
