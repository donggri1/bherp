import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from './entities/menu.entity';
import { RoleMenuPermission } from './entities/role-menu-permission.entity';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, RoleMenuPermission])],
  controllers: [MenusController],
  providers: [MenusService],
  exports: [MenusService, TypeOrmModule],
})
export class MenusModule {}
