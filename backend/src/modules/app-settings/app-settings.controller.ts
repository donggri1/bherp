import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { MenuCode } from '../../common/decorators/menu-code.decorator';
import { Permission } from '../../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { AppSettingsService } from './app-settings.service';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

@Controller('app-settings')
@UseGuards(JwtAuthGuard, MenuPermissionGuard)
@MenuCode('OP_ADMIN_SETTINGS')
export class AppSettingsController {
  constructor(private readonly service: AppSettingsService) {}

  @Get()
  @Permission('read')
  find(@CompanyId() companyId: number) {
    return this.service.getSettings(companyId);
  }

  @Put()
  @Permission('update')
  update(@CompanyId() companyId: number, @Body() dto: UpdateAppSettingsDto) {
    return this.service.updateSettings(companyId, dto);
  }
}
