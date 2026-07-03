import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { MenuCode } from '../../common/decorators/menu-code.decorator';
import { Permission } from '../../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { DISTRIBUTION_WORKFORCE_MENU_CODE } from './constants/distribution-workforce.constants';
import { BulkDistributionWorkforceDto } from './dto/bulk-distribution-workforce.dto';
import { DistributionWorkforceQueryDto } from './dto/distribution-workforce-query.dto';
import { FetchDistributionWorkforceDto } from './dto/fetch-distribution-workforce.dto';
import { DistributionWorkforceService } from './distribution-workforce.service';

@Controller('distribution-workforce')
@UseGuards(JwtAuthGuard, MenuPermissionGuard)
@MenuCode(DISTRIBUTION_WORKFORCE_MENU_CODE)
export class DistributionWorkforceController {
  constructor(private readonly service: DistributionWorkforceService) {}

  @Get('employees')
  @Permission('read')
  findEmployees(
    @CompanyId() companyId: number,
    @Query() query: DistributionWorkforceQueryDto,
  ) {
    return this.service.findEmployees(companyId, query);
  }

  @Post('register-base-certificate')
  @Permission('create')
  registerBaseCertificate(
    @CompanyId() companyId: number,
    @Body() dto: BulkDistributionWorkforceDto,
  ) {
    return this.service.registerBaseCertificate(companyId, dto);
  }

  @Post('fetch-and-upsert')
  @Permission('update')
  fetchAndUpsert(
    @CompanyId() companyId: number,
    @Body() dto: FetchDistributionWorkforceDto,
  ) {
    return this.service.fetchAndUpsert(companyId, dto);
  }
}
