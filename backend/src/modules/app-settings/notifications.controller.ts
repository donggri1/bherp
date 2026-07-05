import { Controller, Get, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { CurrentUser as CurrentUserType } from '../../common/types/current-user.type';
import { AppSettingsService } from './app-settings.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: AppSettingsService) {}

  @Get('certificate-expiry')
  certificateExpiry(
    @CompanyId() companyId: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.getCertificateExpiryAlerts(companyId, user.userId);
  }
}
