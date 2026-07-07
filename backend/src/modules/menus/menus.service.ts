import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Menu } from './entities/menu.entity';
import { initialMenus } from './menus.seed';

@Injectable()
export class MenusService implements OnModuleInit {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async onModuleInit() {
    for (const item of initialMenus) {
      const exists = await this.menuRepository.findOne({
        where: { menuCode: item.menuCode },
      });
      if (!exists) {
        await this.menuRepository.save(this.menuRepository.create(item));
        continue;
      }

      await this.menuRepository.update({ id: exists.id }, item);
    }
  }

  async findAll(query: PaginationDto) {
    const [items, total] = await this.menuRepository.findAndCount({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { menuGroupCode: 'ASC', sortOrder: 'ASC' },
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const menu = await this.menuRepository.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('메뉴를 찾을 수 없습니다.');
    return menu;
  }

  create(dto: CreateMenuDto) {
    return this.menuRepository.save(this.menuRepository.create(dto));
  }

  async update(id: number, dto: UpdateMenuDto) {
    await this.menuRepository.update({ id }, dto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.menuRepository.softDelete({ id });
  }
}
