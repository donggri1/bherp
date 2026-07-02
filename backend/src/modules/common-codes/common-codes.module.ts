import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonCodesController } from './common-codes.controller';
import { CommonCodesService } from './common-codes.service';
import { CommonCode } from './entities/common-code.entity';
import { CommonCodeGroup } from './entities/common-code-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommonCodeGroup, CommonCode])],
  controllers: [CommonCodesController],
  providers: [CommonCodesService],
})
export class CommonCodesModule {}
