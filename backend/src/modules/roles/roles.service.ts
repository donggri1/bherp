import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Menu } from '../menus/entities/menu.entity';
import { RoleMenuPermission } from '../menus/entities/role-menu-permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { SaveRoleMenuPermissionsDto } from './dto/role-menu-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(RoleMenuPermission)
    private readonly permissionRepository: Repository<RoleMenuPermission>,
  ) {}

  async findAll(companyId: number, query: PaginationDto) {
    const [items, total] = await this.roleRepository.findAndCount({
      where: { companyId },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { id: 'DESC' },
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(companyId: number, id: number) {
    const role = await this.roleRepository.findOne({ where: { id, companyId } });
    if (!role) throw new NotFoundException('역할을 찾을 수 없습니다.');
    return role;
  }

  create(companyId: number, dto: CreateRoleDto) {
    return this.roleRepository.save(this.roleRepository.create({ ...dto, companyId }));
  }

  async update(companyId: number, id: number, dto: UpdateRoleDto) {
    await this.roleRepository.update({ id, companyId }, dto);
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.roleRepository.softDelete({ id, companyId });
  }

  async findMenuPermissions(companyId: number, roleId: number) {
    await this.findOne(companyId, roleId);
    const [menus, permissions] = await Promise.all([
      this.menuRepository.find({
        where: { isActive: true },
        order: { menuGroupCode: 'ASC', sortOrder: 'ASC' },
      }),
      this.permissionRepository.find({ where: { companyId, roleId } }),
    ]);
    const permissionMap = new Map(permissions.map((item) => [item.menuId, item]));

    return menus.map((menu) => {
      const permission = permissionMap.get(menu.id);
      return {
        menu,
        permission: {
          menuId: menu.id,
          canRead: permission?.canRead ?? false,
          canCreate: permission?.canCreate ?? false,
          canUpdate: permission?.canUpdate ?? false,
          canDelete: permission?.canDelete ?? false,
          canExcel: permission?.canExcel ?? false,
        },
      };
    });
  }

  async saveMenuPermissions(
    companyId: number,
    roleId: number,
    dto: SaveRoleMenuPermissionsDto,
  ) {
    await this.findOne(companyId, roleId);

    for (const item of dto.permissions) {
      const existing = await this.permissionRepository.findOne({
        where: { companyId, roleId, menuId: item.menuId },
      });
      if (existing) {
        await this.permissionRepository.update(
          { id: existing.id, companyId },
          {
            canRead: item.canRead,
            canCreate: item.canCreate,
            canUpdate: item.canUpdate,
            canDelete: item.canDelete,
            canExcel: item.canExcel,
          },
        );
      } else {
        await this.permissionRepository.save(
          this.permissionRepository.create({
            companyId,
            roleId,
            menuId: item.menuId,
            canRead: item.canRead,
            canCreate: item.canCreate,
            canUpdate: item.canUpdate,
            canDelete: item.canDelete,
            canExcel: item.canExcel,
          }),
        );
      }
    }

    return this.findMenuPermissions(companyId, roleId);
  }
}
