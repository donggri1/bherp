import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { MenuCode } from '../../common/decorators/menu-code.decorator';
import { Permission } from '../../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { HrDashboardQueryDto } from './dto/hr-dashboard-query.dto';
import { HrDashboardService } from './hr-dashboard.service';

@Controller('hr-dashboard')
@UseGuards(JwtAuthGuard, MenuPermissionGuard)
@MenuCode('OP_HR_DASHBOARD')
export class HrDashboardController {
  constructor(private readonly service: HrDashboardService) {}

  @Get()
  @Permission('read')
  getDashboard(
    @CompanyId() companyId: number,
    @Query() query: HrDashboardQueryDto,
  ) {
    return this.service.getDashboard(companyId, query);
  }
}
