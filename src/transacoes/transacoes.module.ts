import { Module } from "@nestjs/common";
import { imovelController } from "src/imovel/imovel.controller";
import { ImovelService } from "src/imovel/imovel.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { TransacoesController } from "./transacoes.controller";
import { TransacoesService } from "./transacoes.service";
import { ClienteService } from "src/cliente/cliente.service";
import { imovelModule } from "src/imovel/imovel.module";
import { ClienteModule } from "src/cliente/cliente.module";

@Module({
    imports: [PrismaModule, imovelModule, ClienteModule],
    controllers: [TransacoesController],
    providers: [TransacoesService],
})
export class TransacoesModule {}