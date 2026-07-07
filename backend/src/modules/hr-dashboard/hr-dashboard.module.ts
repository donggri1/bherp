import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { EmployeeCertificate } from '../employee-certificates/entities/employee-certificate.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Menu } from '../menus/entities/menu.entity';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { HrDashboardController } from './hr-dashboard.controller';
import { HrDashboardService } from './hr-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      EmployeeCertificate,
      UserRole,
      Menu,
      RoleMenuPermission,
    ]),
  ],
  controllers: [HrDashboardController],
  providers: [HrDashboardService, MenuPermissionGuard],
})
export class HrDashboardModule {}
