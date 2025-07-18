import { Module } from '@nestjs/common';
import { CorretorService } from './corretor.service';
import { CorretorController } from './corretor.controller';

@Module({
  controllers: [CorretorController],
  providers: [CorretorService],
  exports: [CorretorService],
})
export class CorretorModule {}

