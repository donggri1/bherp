import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { Menu } from '../menus/entities/menu.entity';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { EmployeeCertificateExpiryStatusController } from './employee-certificate-expiry-status.controller';
import { EmployeeCertificateInquiriesController } from './employee-certificate-inquiries.controller';
import { EmployeeCertificatesController } from './employee-certificates.controller';
import { EmployeeCertificatesService } from './employee-certificates.service';
import { EmployeeCertificate } from './entities/employee-certificate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeCertificate, UserRole, Menu, RoleMenuPermission])],
  controllers: [
    EmployeeCertificatesController,
    EmployeeCertificateInquiriesController,
    EmployeeCertificateExpiryStatusController,
  ],
  providers: [EmployeeCertificatesService, MenuPermissionGuard],
})
export class EmployeeCertificatesModule {}
