import { Module } from '@nestjs/common';
import { TiposImoveisService } from './tipos-imoveis.service';
import { TiposImoveisController } from './tipos-imoveis.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TiposImoveisController],
  providers: [TiposImoveisService],
})
export class TiposImoveisModule {}