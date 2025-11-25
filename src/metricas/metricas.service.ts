import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StatusImovel } from "@prisma/client";

@Injectable()
export class MetricasService {
  constructor(private prismaService: PrismaService) {}

  private calcularComissaoVenda(valor: number): number {
    return valor * 0.05;
  }

  private calcularComissaoAluguel(valor: number): number {
    return valor; 
  }

  async getMetricas(user: any) {        
        let imoveisDisponiveis = 0;
        let imoveisVendidos = 0;
        let imoveisAlugados = 0;
        let totalClientes = 0;
        let totalTransacoes = 0;
        let totalVendas = 0;
        let comissaoVendas = 0;
        let comissaoAluguel = 0;

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

        const imoveisVendidosList = await this.prismaService.imovel.findMany({
            where: {
                corretor_id: user.corretor_id,
                status: StatusImovel.vendido,
            },
            select: {
                valor: true,
            }
        });

        for (const imovel of imoveisVendidosList) {
            const valor = Number(imovel.valor);
            totalVendas += valor;
            comissaoVendas += this.calcularComissaoVenda(valor);
        }

        const imoveisAlugadosList = await this.prismaService.imovel.findMany({
            where: {
                corretor_id: user.corretor_id,
                status: StatusImovel.alugado,
            },
            select: {
                valor_aluguel: true,
            }
        });

        for (const imovel of imoveisAlugadosList) {
            if (imovel.valor_aluguel) {
                const valor = Number(imovel.valor_aluguel);
                comissaoAluguel += this.calcularComissaoAluguel(valor);
            }
        }
        
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

        const imoveisVendidosList = await this.prismaService.imovel.findMany({
            where: {
                status: StatusImovel.vendido,
            },
            select: {
                valor: true,
            }
        });

        for (const imovel of imoveisVendidosList) {
            const valor = Number(imovel.valor);
            totalVendas += valor;
            comissaoVendas += this.calcularComissaoVenda(valor);
        }

        const imoveisAlugadosList = await this.prismaService.imovel.findMany({
            where: {
                status: StatusImovel.alugado,
            },
            select: {
                valor_aluguel: true,
            }
        });

        for (const imovel of imoveisAlugadosList) {
            if (imovel.valor_aluguel) {
                const valor = Number(imovel.valor_aluguel);
                comissaoAluguel += this.calcularComissaoAluguel(valor);
            }
        }
    }

    return {    
        imoveisDisponiveis,
        imoveisVendidos,
        imoveisAlugados,
        totalClientes,
        totalTransacoes,
        totalVendas,
        comissaoVendas,
        comissaoAluguel
    };
  }
}