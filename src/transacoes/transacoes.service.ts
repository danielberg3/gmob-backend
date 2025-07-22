import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateTransacoesDto } from "./dto/create-transacoes.dto";
import { ImovelService } from "src/imovel/imovel.service";
import { ClienteService } from "src/cliente/cliente.service";
import { UpdateImovelDto } from "src/imovel/dto/update-imovel.dto";

@Injectable()
export class TransacoesService {
    constructor(
        private prismaService: PrismaService,
        private imovelService: ImovelService,
        private clienteService: ClienteService,

        ) {}

    async create(createTransacoesDto: CreateTransacoesDto, currentUser: any) {

        const cliente = await this.clienteService.findByCpf(createTransacoesDto.cpf); 

        if(currentUser.corretor_id !== cliente.corretor_id) {   
            console.log("currentUser", currentUser);
            console.log("cliente", cliente.cliente_id);     
            throw new UnauthorizedException('Você não tem permissão para realizar transações para este cliente.');
        }

        const imovel = await this.imovelService.findOne(createTransacoesDto.imovel_id, currentUser);
        if (imovel.status !== 'disponivel') {
            throw new BadRequestException('Imóvel não está disponível para transação. ');
        }

        const [_, transacao] = await this.prismaService.$transaction([
            this.prismaService.imovel.update({
                where: { imovel_id: createTransacoesDto.imovel_id },
                data: { status: createTransacoesDto.tipo_transacao === 'venda' as any? 'vendido' : 'alugado'},
            }),
            this.prismaService.transacaoImovel.create({
                data: {
                    imovel_id: createTransacoesDto.imovel_id,
                    cliente_id: cliente.cliente_id,
                    corretor_id: currentUser.corretor_id,
                    tipo_transacao: createTransacoesDto.tipo_transacao,
                },
                select: {
                    transacao_id: true,
                    imovel_id: true,
                    cliente_id: true,
                    corretor_id: true,
                    tipo_transacao: true,
                    data_transacao: true,
                },
            }),
        ]);
        
        return transacao;
    }

}