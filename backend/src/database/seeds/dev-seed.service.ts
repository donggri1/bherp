import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  commonCodeGroupSeeds,
  commonCodeSeeds,
} from '../../modules/common-codes/common-codes.seed';
import { CommonCode } from '../../modules/common-codes/entities/common-code.entity';
import { CommonCodeGroup } from '../../modules/common-codes/entities/common-code-group.entity';
import { Company } from '../../modules/companies/entities/company.entity';
import { Menu } from '../../modules/menus/entities/menu.entity';
import { RoleMenuPermission } from '../../modules/menus/entities/role-menu-permission.entity';
import { initialMenus } from '../../modules/menus/menus.seed';
import { Role } from '../../modules/roles/entities/role.entity';
import { UserRole } from '../../modules/roles/entities/user-role.entity';
import { SequenceRule } from '../../modules/sequences/entities/sequence-rule.entity';
import { User } from '../../modules/users/entities/user.entity';

@Injectable()
export class DevSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DevSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(RoleMenuPermission)
    private readonly permissionRepository: Repository<RoleMenuPermission>,
    @InjectRepository(CommonCodeGroup)
    private readonly commonCodeGroupRepository: Repository<CommonCodeGroup>,
    @InjectRepository(CommonCode)
    private readonly commonCodeRepository: Repository<CommonCode>,
    @InjectRepository(SequenceRule)
    private readonly sequenceRuleRepository: Repository<SequenceRule>,
  ) {}

  async onApplicationBootstrap() {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const seedEnabled = this.configService.get<string>('DEV_SEED_ENABLED', 'true') === 'true';
    if (isProduction || !seedEnabled) return;

    const company = await this.seedCompany();
    const menus = await this.seedMenus();
    const role = await this.seedAdminRole(company.id);
    const admin = await this.seedAdminUser(company.id);
    await this.seedUserRole(company.id, admin.id, role.id);
    await this.seedMenuPermissions(company.id, role.id, menus);
    await this.seedCommonCodes(company.id);
    await this.seedSequenceRules(company.id);

    this.logger.log(
      `Development admin ready: ${admin.loginId} / ${this.configService.get<string>(
        'DEV_ADMIN_PASSWORD',
        '00000000',
      )}`,
    );
  }

  private async seedCompany() {
    const existing = await this.companyRepository.findOne({
      where: { companyCode: 'BHERP' },
    });
    if (existing) return existing;

    return this.companyRepository.save(
      this.companyRepository.create({
        companyCode: 'BHERP',
        companyName: 'BHERP',
        businessNumber: '000-00-00000',
        ceoName: '관리자',
        isActive: true,
      }),
    );
  }

  private async seedMenus() {
    const menus: Menu[] = [];
    for (const item of initialMenus) {
      let menu = await this.menuRepository.findOne({
        where: { menuCode: item.menuCode },
      });
      if (!menu) {
        menu = await this.menuRepository.save(this.menuRepository.create(item));
      } else {
        await this.menuRepository.update({ id: menu.id }, item);
        menu = await this.menuRepository.findOneOrFail({ where: { id: menu.id } });
      }
      menus.push(menu);
    }
    return menus;
  }

  private async seedAdminRole(companyId: number) {
    const existing = await this.roleRepository.findOne({
      where: { companyId, roleCode: 'ADMIN' },
    });
    if (existing) return existing;

    return this.roleRepository.save(
      this.roleRepository.create({
        companyId,
        roleCode: 'ADMIN',
        roleName: '관리자',
        description: '개발 초기 관리자 역할',
        isSystem: true,
        isActive: true,
      }),
    );
  }

  private async seedAdminUser(companyId: number) {
    const loginId = this.configService.get<string>('DEV_ADMIN_LOGIN_ID', 'admin');
    const password = this.configService.get<string>('DEV_ADMIN_PASSWORD', '00000000');
    const existing = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.companyId = :companyId', { companyId })
      .andWhere('user.loginId = :loginId', { loginId })
      .getOne();
    if (existing) {
      const passwordMatches = await bcrypt.compare(password, existing.password);
      if (passwordMatches && existing.isActive) return existing;

      await this.userRepository.update(
        { id: existing.id, companyId },
        {
          password: passwordMatches ? existing.password : await bcrypt.hash(password, 10),
          isActive: true,
        },
      );
      return this.userRepository.findOneOrFail({ where: { id: existing.id, companyId } });
    }

    return this.userRepository.save(
      this.userRepository.create({
        companyId,
        loginId,
        password: await bcrypt.hash(password, 10),
        userName: '관리자',
        email: 'admin@example.com',
        isActive: true,
      }),
    );
  }

  private async seedUserRole(companyId: number, userId: number, roleId: number) {
    const existing = await this.userRoleRepository.findOne({
      where: { companyId, userId, roleId },
    });
    if (existing) return existing;

    return this.userRoleRepository.save(
      this.userRoleRepository.create({ companyId, userId, roleId }),
    );
  }

  private async seedMenuPermissions(companyId: number, roleId: number, menus: Menu[]) {
    for (const menu of menus) {
      const existing = await this.permissionRepository.findOne({
        where: { companyId, roleId, menuId: menu.id },
      });
      if (existing) continue;

      await this.permissionRepository.save(
        this.permissionRepository.create({
          companyId,
          roleId,
          menuId: menu.id,
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
          canExcel: true,
        }),
      );
    }
  }

  private async seedCommonCodes(companyId: number) {
    for (const item of commonCodeGroupSeeds) {
      const existing = await this.commonCodeGroupRepository.findOne({
        where: { companyId, groupCode: item.groupCode },
      });
      if (!existing) {
        await this.commonCodeGroupRepository.save(
          this.commonCodeGroupRepository.create({ ...item, companyId }),
        );
      }
    }

    for (const item of commonCodeSeeds) {
      const existing = await this.commonCodeRepository.findOne({
        where: { companyId, groupCode: item.groupCode, code: item.code },
      });
      if (!existing) {
        await this.commonCodeRepository.save(
          this.commonCodeRepository.create({ ...item, companyId }),
        );
      }
    }
  }

  private async seedSequenceRules(companyId: number) {
    const rules: Partial<SequenceRule>[] = [
      { targetType: 'BUSINESS', prefix: 'BIZ', example: 'BIZ-000001' },
      { targetType: 'BUSINESS_UNIT', prefix: 'BU', example: 'BU-000001' },
      { targetType: 'DEPARTMENT', prefix: 'DEPT', example: 'DEPT-000001' },
      { targetType: 'POSITION', prefix: 'POS', example: 'POS-000001' },
      { targetType: 'CERTIFICATE_TYPE', prefix: 'CERT', example: 'CERT-000001' },
      { targetType: 'PROJECT', prefix: 'PRJ', example: 'PRJ-000001' },
      { targetType: 'PROJECT_SITE', prefix: 'SITE', example: 'SITE-000001' },
      { targetType: 'CLIENT', prefix: 'CUST', example: 'CUST-000001' },
      { targetType: 'ITEM', prefix: 'ITEM', example: 'ITEM-000001' },
      { targetType: 'EMPLOYEE', prefix: 'EMP', example: 'EMP-000001' },
    ];

    for (const item of rules) {
      const existing = await this.sequenceRuleRepository.findOne({
        where: { companyId, targetType: item.targetType },
      });
      if (!existing) {
        await this.sequenceRuleRepository.save(
          this.sequenceRuleRepository.create({
            companyId,
            currentLength: 6,
            separator: '-',
            resetCycle: 'NONE',
            isActive: true,
            ...item,
          }),
        );
      }
    }
  }
}
