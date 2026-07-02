import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { Menu } from '../menus/entities/menu.entity';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { BusinessUnitsController } from './business-units.controller';
import { BusinessUnitsService } from './business-units.service';
import { BusinessUnit } from './entities/business-unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessUnit, UserRole, Menu, RoleMenuPermission])],
  controllers: [BusinessUnitsController],
  providers: [BusinessUnitsService, MenuPermissionGuard],
})
export class BusinessUnitsModule {}
