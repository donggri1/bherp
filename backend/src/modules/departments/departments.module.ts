import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { Menu } from '../menus/entities/menu.entity';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { SequencesModule } from '../sequences/sequences.module';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { Department } from './entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Department, UserRole, Menu, RoleMenuPermission]),
    SequencesModule,
  ],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, MenuPermissionGuard],
})
export class DepartmentsModule {}
