import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(companyId: number, query: UserQueryDto) {
    const baseWhere: FindOptionsWhere<User> = {
      companyId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    };
    const keyword = query.keyword?.trim();
    const where = keyword
      ? [
          { ...baseWhere, loginId: Like(`%${keyword}%`) },
          { ...baseWhere, userName: Like(`%${keyword}%`) },
          { ...baseWhere, email: Like(`%${keyword}%`) },
        ]
      : baseWhere;

    const [items, total] = await this.userRepository.findAndCount({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { id: 'DESC' },
    });
    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(companyId: number, id: number) {
    const user = await this.userRepository.findOne({ where: { id, companyId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }

  async create(companyId: number, dto: CreateUserDto) {
    const password = await bcrypt.hash(dto.password, 10);
    return this.userRepository.save(
      this.userRepository.create({ ...dto, password, companyId }),
    );
  }

  async update(companyId: number, id: number, dto: UpdateUserDto) {
    const updateDto = { ...dto };
    if (updateDto.password) updateDto.password = await bcrypt.hash(updateDto.password, 10);
    await this.userRepository.update({ id, companyId }, updateDto);
    return this.findOne(companyId, id);
  }

  remove(companyId: number, id: number) {
    return this.userRepository.softDelete({ id, companyId });
  }
}
