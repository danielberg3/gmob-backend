import { forwardRef, Module } from '@nestjs/common';
import { ImovelService } from './imovel.service';
import { ImovelController } from './imovel.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TransacoesModule } from '../transacoes/transacoes.module';
import { AgendamentosModule } from '../agendamentos/agendamentos.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule, 
    forwardRef(() => TransacoesModule), 
    AgendamentosModule,
    CloudinaryModule 
  ],
  controllers: [ImovelController],
  providers: [ImovelService],
  exports: [ImovelService],
})
export class ImovelModule {}