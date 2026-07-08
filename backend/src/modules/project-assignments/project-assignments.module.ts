import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { Employee } from '../employees/entities/employee.entity';
import { Menu } from '../menus/entities/menu.entity';
import { ProjectSite } from '../project-sites/entities/project-site.entity';
import { Project } from '../projects/entities/project.entity';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { ProjectAssignment } from './entities/project-assignment.entity';
import { ProjectAssignmentsController } from './project-assignments.controller';
import { ProjectAssignmentsService } from './project-assignments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectAssignment,
      Project,
      ProjectSite,
      Employee,
      UserRole,
      Menu,
      RoleMenuPermission,
    ]),
  ],
  controllers: [ProjectAssignmentsController],
  providers: [ProjectAssignmentsService, MenuPermissionGuard],
})
export class ProjectAssignmentsModule {}
