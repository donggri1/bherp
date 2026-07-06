import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { MenuCode } from '../../common/decorators/menu-code.decorator';
import { Permission } from '../../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

const EMPLOYEE_IMPORT_MAX_SIZE = 10 * 1024 * 1024;
const employeeImportInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: EMPLOYEE_IMPORT_MAX_SIZE },
});

@Controller('employees')
@UseGuards(JwtAuthGuard, MenuPermissionGuard)
@MenuCode('OP_EMPLOYEES')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  @Permission('read')
  findAll(@CompanyId() companyId: number, @Query() query: EmployeeQueryDto) {
    return this.service.findAll(companyId, query);
  }

  @Get('excel-template')
  @Permission('read')
  async downloadExcelTemplate(@Res() response: Response) {
    const buffer = await this.service.buildImportTemplate();
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent('사원등록_양식.xlsx')}`,
    );
    response.send(buffer);
  }

  @Get(':id')
  @Permission('read')
  findOne(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.service.findOne(companyId, Number(id));
  }

  @Post()
  @Permission('create')
  create(@CompanyId() companyId: number, @Body() dto: CreateEmployeeDto) {
    return this.service.create(companyId, dto);
  }

  @Post('excel-import')
  @Permission('create')
  @UseInterceptors(employeeImportInterceptor)
  importExcel(@CompanyId() companyId: number, @UploadedFile() file?: Express.Multer.File) {
    return this.service.importFromExcel(companyId, file);
  }

  @Patch(':id')
  @Permission('update')
  update(@CompanyId() companyId: number, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(companyId, Number(id), dto);
  }

  @Delete(':id')
  @Permission('delete')
  remove(@CompanyId() companyId: number, @Param('id') id: string) {
    return this.service.remove(companyId, Number(id));
  }
}
