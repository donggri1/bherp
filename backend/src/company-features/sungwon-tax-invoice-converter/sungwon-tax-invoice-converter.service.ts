import { BadRequestException, Injectable } from '@nestjs/common';
import { SungwonTaxInvoiceConversionDto } from './dto/sungwon-tax-invoice-conversion.dto';
import { buildConvertedTaxInvoiceData, buildTaxInvoicePreview } from './sungwon-tax-invoice-mapper';
import { parseNationalTaxInvoiceWorkbook } from './sungwon-tax-invoice-parser';
import { SungwonTaxInvoiceWorkbookBuilder } from './sungwon-tax-invoice-workbook.builder';
import {
  ConvertedTaxInvoiceData,
  TaxInvoicePreview,
  TaxInvoiceUploadFiles,
} from './types/sungwon-tax-invoice-converter.types';

@Injectable()
export class SungwonTaxInvoiceConverterService {
  constructor(private readonly workbookBuilder: SungwonTaxInvoiceWorkbookBuilder) {}

  preview(files: TaxInvoiceUploadFiles, dto: SungwonTaxInvoiceConversionDto): TaxInvoicePreview {
    return buildTaxInvoicePreview(this.parseAndConvert(files, dto));
  }

  async convert(files: TaxInvoiceUploadFiles, dto: SungwonTaxInvoiceConversionDto) {
    const data = this.parseAndConvert(files, dto);
    const buffer = await this.workbookBuilder.build(data);
    return {
      buffer,
      fileName: `세금계산서(${dto.year}년)-성원전기(주).xlsx`,
    };
  }

  private parseAndConvert(
    files: TaxInvoiceUploadFiles,
    dto: SungwonTaxInvoiceConversionDto,
  ): ConvertedTaxInvoiceData {
    const salesFile = this.getSingleFile(files.salesFile, '국세청 매출 파일');
    const purchaseFile = this.getSingleFile(files.purchaseFile, '국세청 매입 파일');
    this.validateFile(salesFile);
    this.validateFile(purchaseFile);

    const sales = parseNationalTaxInvoiceWorkbook(salesFile, 'sales', dto.year, dto.month);
    const purchases = parseNationalTaxInvoiceWorkbook(
      purchaseFile,
      'purchase',
      dto.year,
      dto.month,
    );
    return buildConvertedTaxInvoiceData(dto.year, dto.month, sales, purchases);
  }

  private getSingleFile(files: Express.Multer.File[] | undefined, label: string) {
    const file = files?.[0];
    if (!file) throw new BadRequestException(`${label}을 업로드하세요.`);
    return file;
  }

  private validateFile(file: Express.Multer.File) {
    const fileName = this.decodeUploadFileName(file.originalname);
    if (!/\.(xls|xlsx)$/i.test(fileName)) {
      throw new BadRequestException('국세청 Excel 파일은 .xls 또는 .xlsx만 업로드할 수 있습니다.');
    }
    if (!file.buffer?.length) {
      throw new BadRequestException(`${fileName} 파일이 비어 있습니다.`);
    }
  }

  private decodeUploadFileName(fileName: string) {
    if (!/[ìíëê]/.test(fileName)) return fileName;
    return Buffer.from(fileName, 'latin1').toString('utf8');
  }
}
