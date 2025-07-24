import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CorretorModule } from './corretor/corretor.module';
import { RedisCacheModule } from './cache/cache.module';
import { ClienteModule } from './cliente/cliente.module';
import { MetricasModule } from './metricas/metricas.module';
import { ImovelModule } from './imovel/imovel.module';
import { TiposImoveisModule } from './tipos-imoveis/tipos-imoveis.module';
import { AgendamentosModule } from './agendamentos/agendamentos.module';
import { TransacoesModule } from './transacoes/transacoes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisCacheModule,
    AuthModule,
    ClienteModule,
    CorretorModule,
    MetricasModule,
    ImovelModule,
    TiposImoveisModule,
    AgendamentosModule,
    TransacoesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
