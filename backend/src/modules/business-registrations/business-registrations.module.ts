import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { Menu } from '../menus/entities/menu.entity';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { BusinessRegistrationsController } from './business-registrations.controller';
import { BusinessRegistrationsService } from './business-registrations.service';
import { BusinessRegistration } from './entities/business-registration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessRegistration, UserRole, Menu, RoleMenuPermission])],
  controllers: [BusinessRegistrationsController],
  providers: [BusinessRegistrationsService, MenuPermissionGuard],
})
export class BusinessRegistrationsModule {}
