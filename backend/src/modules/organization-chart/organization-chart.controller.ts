import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { MenuCode } from '../../common/decorators/menu-code.decorator';
import { Permission } from '../../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { OrganizationChartEmployeesQueryDto } from './dto/organization-chart-employees-query.dto';
import { OrganizationChartService } from './organization-chart.service';

@Controller('organization-chart')
@UseGuards(JwtAuthGuard, MenuPermissionGuard)
@MenuCode('OP_ORGANIZATION_CHART')
export class OrganizationChartController {
  constructor(private readonly service: OrganizationChartService) {}

  @Get()
  @Permission('read')
  getChart(@CompanyId() companyId: number) {
    return this.service.getChart(companyId);
  }

  @Get('departments/:id/employees')
  @Permission('read')
  getDepartmentEmployees(
    @CompanyId() companyId: number,
    @Param('id') id: string,
    @Query() query: OrganizationChartEmployeesQueryDto,
  ) {
    return this.service.getDepartmentEmployees(companyId, Number(id), query);
  }
}
