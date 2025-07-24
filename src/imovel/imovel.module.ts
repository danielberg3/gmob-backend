import { forwardRef, Module } from '@nestjs/common';
import { ImovelService } from './imovel.service';
import { ImovelController } from './imovel.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TransacoesModule } from 'src/transacoes/transacoes.module';
import { AgendamentosModule } from 'src/agendamentos/agendamentos.module';

@Module({
  imports: [PrismaModule, forwardRef(() => TransacoesModule), AgendamentosModule],
  controllers: [ImovelController],
  providers: [ImovelService],
  exports: [ImovelService],
})
export class ImovelModule {}