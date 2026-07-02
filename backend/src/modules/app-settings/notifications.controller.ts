import { Controller, Get, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AppSettingsService } from './app-settings.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: AppSettingsService) {}

  @Get('certificate-expiry')
  certificateExpiry(@CompanyId() companyId: number) {
    return this.service.getCertificateExpiryAlerts(companyId);
  }
}
