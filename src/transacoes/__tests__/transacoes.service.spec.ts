import { Test, TestingModule } from '@nestjs/testing';
import { TransacoesService } from '../transacoes.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ImovelService } from '../../imovel/imovel.service';
import { ClienteService } from '../../cliente/cliente.service';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Perfil,
  StatusImovel,
  TipoTransacao,
  StatusAgendamento,
} from '@prisma/client';
import { CreateTransacoesDto } from '../dto/create-transacoes.dto';

describe('TransacoesService', () => {
  let service: TransacoesService;
  let prisma: PrismaService;
  let imovelService: ImovelService;
  let clienteService: ClienteService;

  const mockPrismaService = {
    imovel: { update: jest.fn() },
    transacaoImovel: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    agendamentoVisita: { findMany: jest.fn() },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      // Simula o comportamento do Prisma real: o callback recebe "tx" e retorna um array
      return callback(mockPrismaService);
    }),
  };

  const mockImovelService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockClienteService = {
    findByCpf: jest.fn(),
  };

  const mockUser = { corretor_id: 1, perfil: Perfil.corretor };
  const mockCliente = { cliente_id: 1, corretor_id: 1, cpf: '111.222.333-44' };
  const mockImovelDisponivel = {
    imovel_id: 1,
    corretor_id: 1,
    status: StatusImovel.disponivel,
  };
  const mockImovelVendido = {
    imovel_id: 1,
    corretor_id: 1,
    status: StatusImovel.vendido,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransacoesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ImovelService, useValue: mockImovelService },
        { provide: ClienteService, useValue: mockClienteService },
      ],
    }).compile();

    service = module.get<TransacoesService>(TransacoesService);
    prisma = module.get<PrismaService>(PrismaService);
    imovelService = module.get<ImovelService>(ImovelService);
    clienteService = module.get<ClienteService>(ClienteService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateTransacoesDto = {
      imovel_id: 1,
      cpf: '111.222.333-44',
      tipo_transacao: TipoTransacao.venda,
    };
    const mockTransacaoCriada = {
      transacao_id: 1,
      imovel_id: 1,
      cliente_id: 1,
      corretor_id: 1,
      tipo_transacao: TipoTransacao.venda,
      data_transacao: new Date(),
    };
    const mockAgendamentos = [
      { agendamento_id: 10, cliente: { nome: 'Cliente Antigo' } },
    ];

    beforeEach(() => {
      (clienteService.findByCpf as jest.Mock).mockResolvedValue(mockCliente);
      (imovelService.findOne as jest.Mock).mockResolvedValue(
        mockImovelDisponivel,
      );
      (prisma.imovel.update as jest.Mock).mockResolvedValue(mockImovelVendido);
      (prisma.transacaoImovel.create as jest.Mock).mockResolvedValue(
        mockTransacaoCriada,
      );
      (prisma.agendamentoVisita.findMany as jest.Mock).mockResolvedValue(
        mockAgendamentos,
      );
    });

    it('deve criar uma transação de VENDA e retornar agendamentos pendentes (RF_26)', async () => {
      const result = await service.create(createDto, mockUser);

      expect(clienteService.findByCpf).toHaveBeenCalledWith(createDto.cpf);
      expect(imovelService.findOne).toHaveBeenCalledWith(
        createDto.imovel_id,
        mockUser,
      );
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.imovel.update).toHaveBeenCalledWith({
        where: { imovel_id: createDto.imovel_id },
        data: { status: 'vendido' },
      });
      expect(prisma.transacaoImovel.create).toHaveBeenCalled();
      expect(prisma.agendamentoVisita.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            imovel_id: mockTransacaoCriada.imovel_id,
            status_agendamento: StatusAgendamento.agendado,
          },
        }),
      );
      expect(result.transacao).toEqual(mockTransacaoCriada);
      expect(result.agendamentosPendentes).toEqual(mockAgendamentos);
    });

    it('deve criar uma transação de ALUGUEL e não retornar agendamentos', async () => {
      const aluguelDto = {
        ...createDto,
        tipo_transacao: TipoTransacao.aluguel,
      };
      const transacaoAluguel = {
        ...mockTransacaoCriada,
        tipo_transacao: TipoTransacao.aluguel,
      };
      (prisma.transacaoImovel.create as jest.Mock).mockResolvedValue(
        transacaoAluguel,
      );

      const result = await service.create(aluguelDto, mockUser);

      expect(prisma.imovel.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'alugado' } }),
      );
      expect(prisma.agendamentoVisita.findMany).not.toHaveBeenCalled();
      expect(result.transacao).toEqual(transacaoAluguel);
      expect(result.agendamentosPendentes).toEqual([]);
    });

    it('deve lançar UnauthorizedException se o corretor não for dono do cliente', async () => {
      (clienteService.findByCpf as jest.Mock).mockResolvedValue({
        ...mockCliente,
        corretor_id: 2,
      });

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar BadRequestException se o imóvel não estiver "disponivel"', async () => {
      (imovelService.findOne as jest.Mock).mockResolvedValue(mockImovelVendido);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar transações com include de imóvel e cliente', async () => {
      const mockTransacoes = [
        {
          transacao_id: 1,
          imovel: { rua: 'Rua A' },
          cliente: { nome: 'Cliente B' },
        },
      ];
      (prisma.transacaoImovel.findMany as jest.Mock).mockResolvedValue(
        mockTransacoes,
      );
      (prisma.transacaoImovel.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll(mockUser, 1, 10);

      expect(prisma.transacaoImovel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { corretor_id: mockUser.corretor_id },
          include: expect.any(Object),
        }),
      );
      expect(result.transacoesComDetalhes).toEqual(mockTransacoes);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('findOne', () => {
    const mockTransacaoCompleta = {
      transacao_id: 1,
      corretor_id: 1,
      imovel: { imovel_id: 1 },
      cliente: { cliente_id: 1 },
    };

    it('deve retornar uma transação com include', async () => {
      (prisma.transacaoImovel.findUnique as jest.Mock).mockResolvedValue(
        mockTransacaoCompleta,
      );

      const result = await service.findOne(1, mockUser);

      expect(prisma.transacaoImovel.findUnique).toHaveBeenCalledWith({
        where: { transacao_id: 1 },
        include: { imovel: true, cliente: true },
      });
      expect(result).toEqual(mockTransacaoCompleta);
    });

    it('deve lançar NotFoundException se não existir', async () => {
      (prisma.transacaoImovel.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar UnauthorizedException se o corretor não for o dono', async () => {
      (prisma.transacaoImovel.findUnique as jest.Mock).mockResolvedValue({
        ...mockTransacaoCompleta,
        corretor_id: 2,
      });
      await expect(service.findOne(1, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('remove', () => {
    const mockTransacaoSimples = {
      transacao_id: 1,
      corretor_id: 1,
      imovel_id: 1,
    };

    it('deve remover e redefinir o status do imóvel', async () => {
      (prisma.transacaoImovel.findUnique as jest.Mock).mockResolvedValue(
        mockTransacaoSimples,
      );
      (prisma.transacaoImovel.delete as jest.Mock).mockResolvedValue(true);
      (imovelService.update as jest.Mock).mockResolvedValue(true);

      const result = await service.remove(1, mockUser);

      expect(result.message).toBe('Transação removida com sucesso');
    });

    it('deve lançar BadRequestException se não encontrar', async () => {
      (prisma.transacaoImovel.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.remove(999, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar UnauthorizedException se não for o dono', async () => {
      (prisma.transacaoImovel.findUnique as jest.Mock).mockResolvedValue({
        ...mockTransacaoSimples,
        corretor_id: 2,
      });
      await expect(service.remove(1, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
