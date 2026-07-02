import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { Menu } from '../menus/entities/menu.entity';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { SequencesModule } from '../sequences/sequences.module';
import { Position } from './entities/position.entity';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Position, UserRole, Menu, RoleMenuPermission]),
    SequencesModule,
  ],
  controllers: [PositionsController],
  providers: [PositionsService, MenuPermissionGuard],
})
export class PositionsModule {}
