import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { Menu } from '../../modules/menus/entities/menu.entity';
import { RoleMenuPermission } from '../../modules/menus/entities/role-menu-permission.entity';
import { UserRole } from '../../modules/roles/entities/user-role.entity';
import { SungwonTaxInvoiceConverterController } from './sungwon-tax-invoice-converter.controller';
import { SungwonTaxInvoiceConverterService } from './sungwon-tax-invoice-converter.service';
import { SungwonTaxInvoiceWorkbookBuilder } from './sungwon-tax-invoice-workbook.builder';

@Module({
  imports: [TypeOrmModule.forFeature([UserRole, Menu, RoleMenuPermission])],
  controllers: [SungwonTaxInvoiceConverterController],
  providers: [
    SungwonTaxInvoiceConverterService,
    SungwonTaxInvoiceWorkbookBuilder,
    MenuPermissionGuard,
  ],
})
export class SungwonTaxInvoiceConverterModule {}
