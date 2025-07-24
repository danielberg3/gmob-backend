import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MetricasService {
  constructor(private prismaService: PrismaService) {}

  async getMetricas(user: any) {        
        let imoveisDisponiveis = 0;
        let imoveisVendidos = 0;
        let imoveisAlugados = 0;
        let totalClientes = 0;
        let totalTransacoes = 0;
        let totalVendas = 0;

    if (user.perfil !== 'administrador') {
        const result = await this.prismaService.imovel.groupBy({
            by: ['status'],
            _count: {
                _all: true, 
            },
            where: {
                corretor_id: user.corretor_id,
            },
        });

        for (const item of result) {
            switch (item.status) {
                case 'disponivel':
                imoveisDisponiveis = item._count._all;
                break;
                case 'vendido':
                imoveisVendidos = item._count._all;
                break;
                case 'alugado':
                imoveisAlugados = item._count._all;
                break;
            }
        }  

        totalClientes = await this.prismaService.cliente.count({
            where: {
                corretor_id: user.corretor_id,  
                arquivado: false,
            },
        })

        totalTransacoes = await this.prismaService.transacaoImovel.count({
            where: {
                corretor_id: user.corretor_id,  
            },
        });

        const listaDeImoveis = await this.prismaService.transacaoImovel.findMany
        ({
            where: {
                corretor_id: user.corretor_id,  
            },
            select: {
                imovel_id: true,
            },
        });

        const resultado = await this.prismaService.imovel.aggregate({
            _sum: {
                valor: true,
            },
            where: {
                imovel_id: {
                    in: listaDeImoveis.map(item => item.imovel_id),
                },
                status: 'vendido',
            },
        });
        totalVendas = resultado._sum.valor ? Number(resultado._sum.valor) : 0;
        
    } else {
        const result = await this.prismaService.imovel.groupBy({
            by: ['status'],
            _count: {
                _all: true, 
            },
        });

        for (const item of result) {        
            switch (item.status) {
                case 'disponivel':
                imoveisDisponiveis = item._count._all;
                break;
                case 'vendido':
                imoveisVendidos = item._count._all;
                break;
                case 'alugado':
                imoveisAlugados = item._count._all;
                break;
            }
        }

        totalClientes = await this.prismaService.cliente.count({
            where: {
                arquivado: false,
            }
        })

        totalTransacoes = await this.prismaService.transacaoImovel.count();

        const listaDeImoveis = await this.prismaService.transacaoImovel.findMany
        ({
            select: {
                imovel_id: true,
            },
        });

        const resultado = await this.prismaService.imovel.aggregate({
            _sum: {
                valor: true,
            },
            where: {
                imovel_id: {
                    in: listaDeImoveis.map(item => item.imovel_id),
                },
                status: 'vendido',
            },
        });
        totalVendas = resultado._sum.valor ? Number(resultado._sum.valor) : 0;
    }
    return {    
        imoveisDisponiveis,
        imoveisVendidos,
        imoveisAlugados,
        totalClientes,
        totalTransacoes,
        totalVendas,
    };
  }
}