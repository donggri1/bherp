import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MENU_CODE_KEY } from '../decorators/menu-code.decorator';
import { PERMISSION_KEY, PermissionAction } from '../decorators/permission.decorator';
import { CurrentUser } from '../types/current-user.type';
import { Menu } from '../../modules/menus/entities/menu.entity';
import { RoleMenuPermission } from '../../modules/menus/entities/role-menu-permission.entity';
import { UserRole } from '../../modules/roles/entities/user-role.entity';

@Injectable()
export class MenuPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(RoleMenuPermission)
    private readonly roleMenuPermissionRepository: Repository<RoleMenuPermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const menuCode = this.reflector.getAllAndOverride<string>(MENU_CODE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const permission = this.reflector.getAllAndOverride<PermissionAction>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? 'read';

    if (!menuCode) return true;

    const user = context.switchToHttp().getRequest().user as CurrentUser | undefined;
    if (!user) throw new ForbiddenException('사용자 정보가 없습니다.');

    const menu = await this.menuRepository.findOne({ where: { menuCode, isActive: true } });
    if (!menu) throw new ForbiddenException('메뉴 정보를 찾을 수 없습니다.');

    const userRoles = await this.userRoleRepository.find({
      where: { companyId: user.companyId, userId: user.userId },
    });
    const roleIds = userRoles.map((userRole) => userRole.roleId);
    if (roleIds.length === 0) throw new ForbiddenException('메뉴 권한이 없습니다.');

    const permissions = await this.roleMenuPermissionRepository
      .createQueryBuilder('permission')
      .where('permission.companyId = :companyId', { companyId: user.companyId })
      .andWhere('permission.menuId = :menuId', { menuId: menu.id })
      .andWhere('permission.roleId IN (:...roleIds)', { roleIds })
      .getMany();

    if (permissions.some((item) => this.hasPermission(item, permission))) return true;
    throw new ForbiddenException('메뉴 권한이 없습니다.');
  }

  private hasPermission(item: RoleMenuPermission, permission: PermissionAction) {
    const key = {
      read: 'canRead',
      create: 'canCreate',
      update: 'canUpdate',
      delete: 'canDelete',
      excel: 'canExcel',
    }[permission] as keyof RoleMenuPermission;
    return Boolean(item[key]);
  }
}
