import {
  Body,
  Controller,
  Post,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { MenuCode } from '../../common/decorators/menu-code.decorator';
import { Permission } from '../../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MenuPermissionGuard } from '../../common/guards/menu-permission.guard';
import {
  SUNGWON_TAX_INVOICE_CONVERTER_MENU_CODE,
  TAX_INVOICE_UPLOAD_MAX_SIZE,
} from './constants/sungwon-tax-invoice-converter.constants';
import { SungwonTaxInvoiceConversionDto } from './dto/sungwon-tax-invoice-conversion.dto';
import { SungwonTaxInvoiceConverterService } from './sungwon-tax-invoice-converter.service';
import type { TaxInvoiceUploadFiles } from './types/sungwon-tax-invoice-converter.types';

const uploadInterceptor = FileFieldsInterceptor(
  [
    { name: 'salesFile', maxCount: 1 },
    { name: 'purchaseFile', maxCount: 1 },
  ],
  {
    storage: memoryStorage(),
    limits: { fileSize: TAX_INVOICE_UPLOAD_MAX_SIZE },
  },
);

@Controller('sungwon-tax-invoice-converter')
@UseGuards(JwtAuthGuard, MenuPermissionGuard)
@MenuCode(SUNGWON_TAX_INVOICE_CONVERTER_MENU_CODE)
export class SungwonTaxInvoiceConverterController {
  constructor(private readonly service: SungwonTaxInvoiceConverterService) {}

  @Post('preview')
  @Permission('read')
  @UseInterceptors(uploadInterceptor)
  preview(
    @UploadedFiles() files: TaxInvoiceUploadFiles,
    @Body() dto: SungwonTaxInvoiceConversionDto,
  ) {
    return this.service.preview(files, dto);
  }

  @Post('convert')
  @Permission('create')
  @UseInterceptors(uploadInterceptor)
  async convert(
    @UploadedFiles() files: TaxInvoiceUploadFiles,
    @Body() dto: SungwonTaxInvoiceConversionDto,
    @Res() response: Response,
  ) {
    const result = await this.service.convert(files, dto);
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`,
    );
    response.send(result.buffer);
  }
}
