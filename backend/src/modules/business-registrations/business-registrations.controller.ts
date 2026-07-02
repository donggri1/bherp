import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { MenuCode } from '../../common/decorators/menu-code.decorator';
import { Permission } from '../../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { BusinessRegistrationsService } from './business-registrations.service';
import { BusinessRegistrationQueryDto } from './dto/business-registration-query.dto';
import { CreateBusinessRegistrationDto } from './dto/create-business-registration.dto';
import { UpdateBusinessRegistrationDto } from './dto/update-business-registration.dto';

@Controller('business-registrations')
@UseGuards(JwtAuthGuard, MenuPermissionGuard)
@MenuCode('OP_BUSINESS_REGISTRATION')
export class BusinessRegistrationsController {
  constructor(private readonly service: BusinessRegistrationsService) {}

  @Get()
  @Permission('read')
  findAll(@CompanyId() companyId: number, @Query() query: BusinessRegistrationQueryDto) {
    return this.service.findAll(companyId, query);
  }

  @Get(':id')
  @Permission('read')
  findOne(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.service.findOne(companyId, Number(id));
  }

  @Post()
  @Permission('create')
  create(@CompanyId() companyId: number, @Body() dto: CreateBusinessRegistrationDto) {
    return this.service.create(companyId, dto);
  }

  @Patch(':id')
  @Permission('update')
  update(@CompanyId() companyId: number, @Param('id') id: string, @Body() dto: UpdateBusinessRegistrationDto) {
    return this.service.update(companyId, Number(id), dto);
  }

  @Delete(':id')
  @Permission('delete')
  remove(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.service.remove(companyId, Number(id));
  }
}
