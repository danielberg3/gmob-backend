
import { Module } from '@nestjs/common';
import { ImovelService } from './imovel.service';
import { imovelController } from './imovel.controller';
import { PrismaModule } from 'src/prisma/prisma.module'; 

@Module({
  imports: [PrismaModule],
  controllers: [imovelController],
  providers: [ImovelService],
})
export class imovelModule {}