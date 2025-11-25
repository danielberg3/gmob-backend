import { Test, TestingModule } from '@nestjs/testing';
import { MetricasService } from '../metricas.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusImovel } from '@prisma/client';

describe('MetricasService', () => {
  let service: MetricasService;
  let prisma: PrismaService;

  // Mock do PrismaService
  const mockPrismaService = {
    imovel: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    cliente: {
      count: jest.fn(),
    },
    transacaoImovel: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  // Mock de dados para testes
  const mockUserCorretor = { corretor_id: 1, perfil: 'corretor' };
  const mockUserAdmin = { corretor_id: 99, perfil: 'administrador' };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricasService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MetricasService>(MetricasService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('getMetricas', () => {
    it('deve retornar métricas corretas para um corretor', async () => {
      mockPrismaService.imovel.groupBy.mockResolvedValue([
        { status: StatusImovel.disponivel, _count: { _all: 5 } },
        { status: StatusImovel.vendido, _count: { _all: 2 } },
        { status: StatusImovel.alugado, _count: { _all: 3 } },
      ]);

      mockPrismaService.cliente.count.mockResolvedValue(10);
      mockPrismaService.transacaoImovel.count.mockResolvedValue(5);

      mockPrismaService.imovel.findMany
        .mockResolvedValueOnce([
          { valor: 200000 },
          { valor: 300000 },
        ]) 
        .mockResolvedValueOnce([
          { valor_aluguel: 1500 },
          { valor_aluguel: 2000 },
          { valor_aluguel: 1000 },
        ]);

      // Usamos 'as any' para evitar erro de tipagem no teste se a inferência falhar
      const result = await service.getMetricas(mockUserCorretor) as any;

      expect(mockPrismaService.imovel.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { corretor_id: mockUserCorretor.corretor_id } })
      );
      
      expect(result.imoveisDisponiveis).toBe(5);
      expect(result.imoveisVendidos).toBe(2);
      expect(result.imoveisAlugados).toBe(3);
      expect(result.totalClientes).toBe(10);
      expect(result.totalTransacoes).toBe(5);
      
      expect(result.totalVendas).toBe(500000);
      expect(result.comissaoVendas).toBe(25000);
      expect(result.comissaoAluguel).toBe(4500);
    });

    it('deve retornar métricas globais para administrador', async () => {
      mockPrismaService.imovel.groupBy.mockResolvedValue([
        { status: StatusImovel.disponivel, _count: { _all: 100 } },
      ]);
      mockPrismaService.cliente.count.mockResolvedValue(50);
      mockPrismaService.transacaoImovel.count.mockResolvedValue(20);
      
      mockPrismaService.imovel.findMany
        .mockResolvedValueOnce([{ valor: 1000000 }])
        .mockResolvedValueOnce([{ valor_aluguel: 5000 }]);

      const result = await service.getMetricas(mockUserAdmin) as any;

      expect(mockPrismaService.imovel.groupBy).toHaveBeenCalledWith(
        expect.not.objectContaining({ where: { corretor_id: expect.anything() } })
      );

      expect(result.imoveisDisponiveis).toBe(100);
      expect(result.comissaoVendas).toBe(50000);
      expect(result.comissaoAluguel).toBe(5000);
    });

    it('deve lidar corretamente com valores nulos ou listas vazias', async () => {
       mockPrismaService.imovel.groupBy.mockResolvedValue([]);
       mockPrismaService.cliente.count.mockResolvedValue(0);
       mockPrismaService.transacaoImovel.count.mockResolvedValue(0);
       
       mockPrismaService.imovel.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

       const result = await service.getMetricas(mockUserCorretor) as any;

       expect(result.totalVendas).toBe(0);
       expect(result.comissaoVendas).toBe(0);
       expect(result.comissaoAluguel).toBe(0);
    });
  });
});