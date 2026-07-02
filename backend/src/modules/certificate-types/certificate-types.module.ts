import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { Menu } from '../menus/entities/menu.entity';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { SequencesModule } from '../sequences/sequences.module';
import { CertificateTypesController } from './certificate-types.controller';
import { CertificateTypesService } from './certificate-types.service';
import { CertificateType } from './entities/certificate-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CertificateType, UserRole, Menu, RoleMenuPermission]),
    SequencesModule,
  ],
  controllers: [CertificateTypesController],
  providers: [CertificateTypesService, MenuPermissionGuard],
})
export class CertificateTypesModule {}
