import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CommonCodesService } from './common-codes.service';
import { CreateCommonCodeDto } from './dto/create-common-code.dto';
import { CreateCommonCodeGroupDto } from './dto/create-common-code-group.dto';
import { UpdateCommonCodeDto } from './dto/update-common-code.dto';
import { UpdateCommonCodeGroupDto } from './dto/update-common-code-group.dto';

@Controller('common-codes')
@UseGuards(JwtAuthGuard)
export class CommonCodesController {
  constructor(private readonly service: CommonCodesService) {}

  @Get('groups')
  findGroups(@CompanyId() companyId: number, @Query() query: PaginationDto) {
    return this.service.findGroups(companyId, query);
  }

  @Post('groups')
  createGroup(@CompanyId() companyId: number, @Body() dto: CreateCommonCodeGroupDto) {
    return this.service.createGroup(companyId, dto);
  }

  @Patch('groups/:id')
  updateGroup(@CompanyId() companyId: number, @Param('id') id: string, @Body() dto: UpdateCommonCodeGroupDto) {
    return this.service.updateGroup(companyId, Number(id), dto);
  }

  @Delete('groups/:id')
  removeGroup(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.service.removeGroup(companyId, Number(id));
  }

  @Get('codes')
  findCodes(@CompanyId() companyId: number, @Query('groupCode') groupCode: string | undefined, @Query() query: PaginationDto) {
    return this.service.findCodes(companyId, groupCode, query);
  }

  @Post('codes')
  createCode(@CompanyId() companyId: number, @Body() dto: CreateCommonCodeDto) {
    return this.service.createCode(companyId, dto);
  }

  @Patch('codes/:id')
  updateCode(@CompanyId() companyId: number, @Param('id') id: string, @Body() dto: UpdateCommonCodeDto) {
    return this.service.updateCode(companyId, Number(id), dto);
  }

  @Delete('codes/:id')
  removeCode(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.service.removeCode(companyId, Number(id));
  }
}
