import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateSequenceRuleDto } from './dto/create-sequence-rule.dto';
import { IssueSequenceDto } from './dto/issue-sequence.dto';
import { UpdateSequenceRuleDto } from './dto/update-sequence-rule.dto';
import { SequencesService } from './sequences.service';

@Controller('sequences')
@UseGuards(JwtAuthGuard)
export class SequencesController {
  constructor(private readonly service: SequencesService) {}

  @Get('rules')
  findRules(@CompanyId() companyId: number, @Query() query: PaginationDto) {
    return this.service.findRules(companyId, query);
  }

  @Post('rules')
  createRule(@CompanyId() companyId: number, @Body() dto: CreateSequenceRuleDto) {
    return this.service.createRule(companyId, dto);
  }

  @Patch('rules/:id')
  updateRule(@CompanyId() companyId: number, @Param('id') id: string, @Body() dto: UpdateSequenceRuleDto) {
    return this.service.updateRule(companyId, Number(id), dto);
  }

  @Delete('rules/:id')
  removeRule(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.service.removeRule(companyId, Number(id));
  }

  @Post('issue')
  issue(@CompanyId() companyId: number, @Body() dto: IssueSequenceDto) {
    return this.service.issue(companyId, dto.targetType);
  }
}
