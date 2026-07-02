import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonCode } from '../../modules/common-codes/entities/common-code.entity';
import { CommonCodeGroup } from '../../modules/common-codes/entities/common-code-group.entity';
import { Company } from '../../modules/companies/entities/company.entity';
import { Menu } from '../../modules/menus/entities/menu.entity';
import { RoleMenuPermission } from '../../modules/menus/entities/role-menu-permission.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { UserRole } from '../../modules/roles/entities/user-role.entity';
import { SequenceRule } from '../../modules/sequences/entities/sequence-rule.entity';
import { User } from '../../modules/users/entities/user.entity';
import { DevSeedService } from './dev-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      User,
      Role,
      UserRole,
      Menu,
      RoleMenuPermission,
      CommonCodeGroup,
      CommonCode,
      SequenceRule,
    ]),
  ],
  providers: [DevSeedService],
})
export class DevSeedModule {}
