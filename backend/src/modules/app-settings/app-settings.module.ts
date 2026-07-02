import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { CertificateType } from '../certificate-types/entities/certificate-type.entity';
import { EmployeeCertificate } from '../employee-certificates/entities/employee-certificate.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Menu } from '../menus/entities/menu.entity';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { AppSettingsController } from './app-settings.controller';
import { AppSettingsService } from './app-settings.service';
import { AppSetting } from './entities/app-setting.entity';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppSetting,
      EmployeeCertificate,
      Employee,
      CertificateType,
      UserRole,
      Menu,
      RoleMenuPermission,
    ]),
  ],
  controllers: [AppSettingsController, NotificationsController],
  providers: [AppSettingsService, MenuPermissionGuard],
})
export class AppSettingsModule {}
