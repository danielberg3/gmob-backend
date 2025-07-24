import { forwardRef, Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { TransacoesController } from "./transacoes.controller";
import { TransacoesService } from "./transacoes.service";
import { ImovelModule } from "src/imovel/imovel.module";
import { ClienteModule } from "src/cliente/cliente.module";

@Module({
    imports: [PrismaModule, forwardRef(() => ImovelModule), ClienteModule],
    controllers: [TransacoesController],
    providers: [TransacoesService],
    exports: [TransacoesService],
})
export class TransacoesModule {}