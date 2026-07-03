import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { CertificateType } from '../../modules/certificate-types/entities/certificate-type.entity';
import { EmployeeCertificate } from '../../modules/employee-certificates/entities/employee-certificate.entity';
import { Employee } from '../../modules/employees/entities/employee.entity';
import { Menu } from '../../modules/menus/entities/menu.entity';
import { RoleMenuPermission } from '../../modules/menus/entities/role-menu-permission.entity';
import { UserRole } from '../../modules/roles/entities/user-role.entity';
import { SequencesModule } from '../../modules/sequences/sequences.module';
import { DistributionWorkforceController } from './distribution-workforce.controller';
import { DistributionWorkforceKepcoClient } from './distribution-workforce-kepco.client';
import { DistributionWorkforceService } from './distribution-workforce.service';
import { DistributionWorkforceCertificate } from './entities/distribution-workforce-certificate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      CertificateType,
      EmployeeCertificate,
      DistributionWorkforceCertificate,
      UserRole,
      Menu,
      RoleMenuPermission,
    ]),
    SequencesModule,
  ],
  controllers: [DistributionWorkforceController],
  providers: [
    DistributionWorkforceService,
    DistributionWorkforceKepcoClient,
    MenuPermissionGuard,
  ],
})
export class DistributionWorkforceModule {}
