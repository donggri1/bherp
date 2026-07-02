import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { MenuCode } from '../../common/decorators/menu-code.decorator';
import { Permission } from '../../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { EmployeeCertificateQueryDto } from './dto/employee-certificate-query.dto';
import { EmployeeCertificatesService } from './employee-certificates.service';

@Controller('employee-certificate-inquiries')
@UseGuards(JwtAuthGuard, MenuPermissionGuard)
@MenuCode('OP_EMPLOYEE_CERTIFICATE_INQUIRY')
export class EmployeeCertificateInquiriesController {
  constructor(private readonly service: EmployeeCertificatesService) {}

  @Get()
  @Permission('read')
  findAll(@CompanyId() companyId: number, @Query() query: EmployeeCertificateQueryDto) {
    return this.service.findAll(companyId, query);
  }
}
