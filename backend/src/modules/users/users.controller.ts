import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { MenuCode } from '../../common/decorators/menu-code.decorator';
import { Permission } from '../../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, MenuPermissionGuard)
@MenuCode('OP_USERS')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permission('read')
  findAll(@CompanyId() companyId: number, @Query() query: UserQueryDto) {
    return this.usersService.findAll(companyId, query);
  }

  @Get(':id')
  @Permission('read')
  findOne(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.usersService.findOne(companyId, Number(id));
  }

  @Post()
  @Permission('create')
  create(@CompanyId() companyId: number, @Body() dto: CreateUserDto) {
    return this.usersService.create(companyId, dto);
  }

  @Patch(':id')
  @Permission('update')
  update(@CompanyId() companyId: number, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(companyId, Number(id), dto);
  }

  @Delete(':id')
  @Permission('delete')
  remove(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.usersService.remove(companyId, Number(id));
  }
}
