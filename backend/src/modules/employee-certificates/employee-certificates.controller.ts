import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { MenuCode } from '../../common/decorators/menu-code.decorator';
import { Permission } from '../../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { CreateEmployeeCertificateDto } from './dto/create-employee-certificate.dto';
import { EmployeeCertificateQueryDto } from './dto/employee-certificate-query.dto';
import { UpdateEmployeeCertificateDto } from './dto/update-employee-certificate.dto';
import { EmployeeCertificatesService } from './employee-certificates.service';

@Controller('employee-certificates')
@UseGuards(JwtAuthGuard, MenuPermissionGuard)
@MenuCode('OP_EMPLOYEE_CERTIFICATES')
export class EmployeeCertificatesController {
  constructor(private readonly service: EmployeeCertificatesService) {}

  @Get()
  @Permission('read')
  findAll(@CompanyId() companyId: number, @Query() query: EmployeeCertificateQueryDto) {
    return this.service.findAll(companyId, query);
  }

  @Get(':id')
  @Permission('read')
  findOne(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.service.findOne(companyId, Number(id));
  }

  @Post()
  @Permission('create')
  create(@CompanyId() companyId: number, @Body() dto: CreateEmployeeCertificateDto) {
    return this.service.create(companyId, dto);
  }

  @Patch(':id')
  @Permission('update')
  update(
    @CompanyId() companyId: number,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeCertificateDto,
  ) {
    return this.service.update(companyId, Number(id), dto);
  }

  @Delete(':id')
  @Permission('delete')
  remove(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.service.remove(companyId, Number(id));
  }
}
