import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { BusinessUnit } from '../business-units/entities/business-unit.entity';
import { Department } from '../departments/entities/department.entity';
import { Menu } from '../menus/entities/menu.entity';
import { Position } from '../positions/entities/position.entity';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { SequencesModule } from '../sequences/sequences.module';
import { EmployeeOrganizationHistory } from './entities/employee-organization-history.entity';
import { Employee } from './entities/employee.entity';
import { EmployeesController } from './employees.controller';
import { EmployeesSchemaService } from './employees-schema.service';
import { EmployeesService } from './employees.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      EmployeeOrganizationHistory,
      BusinessUnit,
      Department,
      Position,
      UserRole,
      Menu,
      RoleMenuPermission,
    ]),
    SequencesModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeesSchemaService, MenuPermissionGuard],
})
export class EmployeesModule {}
