import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { MenuCode } from '../../common/decorators/menu-code.decorator';
import { Permission } from '../../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { CreateProjectAssignmentDto } from './dto/create-project-assignment.dto';
import { ProjectAssignmentQueryDto } from './dto/project-assignment-query.dto';
import { UpdateProjectAssignmentDto } from './dto/update-project-assignment.dto';
import { ProjectAssignmentsService } from './project-assignments.service';

@Controller('project-assignments')
@UseGuards(JwtAuthGuard, MenuPermissionGuard)
@MenuCode('OP_PROJECT_ASSIGNMENTS')
export class ProjectAssignmentsController {
  constructor(private readonly service: ProjectAssignmentsService) {}

  @Get()
  @Permission('read')
  findAll(@CompanyId() companyId: number, @Query() query: ProjectAssignmentQueryDto) {
    return this.service.findAll(companyId, query);
  }

  @Get(':id')
  @Permission('read')
  findOne(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.service.findOne(companyId, Number(id));
  }

  @Post()
  @Permission('create')
  create(@CompanyId() companyId: number, @Body() dto: CreateProjectAssignmentDto) {
    return this.service.create(companyId, dto);
  }

  @Patch(':id')
  @Permission('update')
  update(
    @CompanyId() companyId: number,
    @Param('id') id: string,
    @Body() dto: UpdateProjectAssignmentDto,
  ) {
    return this.service.update(companyId, Number(id), dto);
  }

  @Delete(':id')
  @Permission('delete')
  remove(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.service.remove(companyId, Number(id));
  }
}
