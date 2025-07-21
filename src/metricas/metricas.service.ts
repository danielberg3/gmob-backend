import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MetricasService {
  constructor(private prismaService: PrismaService) {}

  async getMetricas(user: any) {
        let imoveisCadastrados = 0;
        let imoveisDisponiveis = 0;
        let imoveisVendidos = 0;
        let imoveisAlugados = 0;

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
            imoveisCadastrados += item._count._all;

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
    } else {
        const result = await this.prismaService.imovel.groupBy({
            by: ['status'],
            _count: {
                _all: true, 
            },
        });

        for (const item of result) {
            imoveisCadastrados += item._count._all;

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
    }
    
    return {
        imoveisCadastrados,
        imoveisDisponiveis,
        imoveisVendidos,
        imoveisAlugados,
    };
  }
}