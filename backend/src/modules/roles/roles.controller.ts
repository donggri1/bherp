import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { SaveRoleMenuPermissionsDto } from './dto/role-menu-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll(@CompanyId() companyId: number, @Query() query: PaginationDto) {
    return this.rolesService.findAll(companyId, query);
  }

  @Get(':id')
  findOne(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.rolesService.findOne(companyId, Number(id));
  }

  @Get(':id/menu-permissions')
  findMenuPermissions(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.rolesService.findMenuPermissions(companyId, Number(id));
  }

  @Post()
  create(@CompanyId() companyId: number, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(companyId, dto);
  }

  @Patch(':id')
  update(@CompanyId() companyId: number, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(companyId, Number(id), dto);
  }

  @Put(':id/menu-permissions')
  saveMenuPermissions(
    @CompanyId() companyId: number,
    @Param('id') id: string,
    @Body() dto: SaveRoleMenuPermissionsDto,
  ) {
    return this.rolesService.saveMenuPermissions(companyId, Number(id), dto);
  }

  @Delete(':id')
  remove(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.rolesService.remove(companyId, Number(id));
  }
}
