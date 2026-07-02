import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SequenceCurrent } from './entities/sequence-current.entity';
import { SequenceRule } from './entities/sequence-rule.entity';
import { SequencesController } from './sequences.controller';
import { SequencesService } from './sequences.service';

@Module({
  imports: [TypeOrmModule.forFeature([SequenceRule, SequenceCurrent])],
  controllers: [SequencesController],
  providers: [SequencesService],
  exports: [SequencesService],
})
export class SequencesModule {}
