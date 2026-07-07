import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { Department } from '../departments/entities/department.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Menu } from '../menus/entities/menu.entity';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { OrganizationChartController } from './organization-chart.controller';
import { OrganizationChartService } from './organization-chart.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Department,
      Employee,
      UserRole,
      Menu,
      RoleMenuPermission,
    ]),
  ],
  controllers: [OrganizationChartController],
  providers: [OrganizationChartService, MenuPermissionGuard],
})
export class OrganizationChartModule {}
