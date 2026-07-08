import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { Menu } from '../menus/entities/menu.entity';
import { Project } from '../projects/entities/project.entity';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { SequencesModule } from '../sequences/sequences.module';
import { ProjectSite } from './entities/project-site.entity';
import { ProjectSitesController } from './project-sites.controller';
import { ProjectSitesService } from './project-sites.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectSite, Project, UserRole, Menu, RoleMenuPermission]),
    SequencesModule,
  ],
  controllers: [ProjectSitesController],
  providers: [ProjectSitesService, MenuPermissionGuard],
})
export class ProjectSitesModule {}
