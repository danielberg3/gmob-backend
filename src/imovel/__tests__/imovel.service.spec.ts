/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ImovelService } from '../imovel.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransacoesService } from '../../transacoes/transacoes.service';
import { AgendamentosService } from '../../agendamentos/agendamentos.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  Disponibilidade,
  Perfil,
  Imovel,
  Prisma,
} from '@prisma/client';
import { CreateImovelDto } from '../dto/create-imovel.dto';
import { UpdateImovelDto } from '../dto/update-imovel.dto';

describe('ImovelService', () => {
  let service: ImovelService;
  let prisma: PrismaService;

  // 👇 FORÇADO COMO ANY (OBRIGATÓRIO COM PRISMA)
  const mockPrismaService: any = {
    imovel: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    imagemImovel: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    transacaoImovel: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn() as jest.Mock,
  };

  const mockTransacoesService = {};
  const mockAgendamentosService = {
    removeByImovelId: jest.fn(),
  };

  const mockCloudinaryService = {
    uploadImage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // implementação segura do $transaction
    mockPrismaService.$transaction.mockImplementation(
      async (operations: any[]) => Promise.all(operations),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImovelService,
        {
          provide: PrismaService,
          useValue: mockPrismaService as any, // 👈 ESSENCIAL
        },
        { provide: TransacoesService, useValue: mockTransacoesService },
        { provide: AgendamentosService, useValue: mockAgendamentosService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    }).compile();

    service = module.get<ImovelService>(ImovelService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // =========================
  // CREATE
  // =========================
  describe('create', () => {
    const user = { corretor_id: 1, perfil: Perfil.corretor };

    const dto: CreateImovelDto = {
      tipo_imovel_id: 1,
      disponibilidade: Disponibilidade.venda,
      estado: 'SP',
      cidade: 'São Paulo',
      rua: 'Rua A',
      numero: '123',
      valor: 100000,
      area: 80,
      numero_comodos: 3,
    };

    const mockImovel: Imovel = {
      imovel_id: 1,
      corretor_id: 1,
      tipo_imovel_id: 1,
      status: 'disponivel',
      valor_aluguel: null,
      disponibilidade: Disponibilidade.venda,
      estado: 'SP',
      cidade: 'São Paulo',
      rua: 'Rua A',
      numero: '123',
      complemento: null,
      valor: new Prisma.Decimal(100000),
      area: new Prisma.Decimal(80),
      numero_comodos: 3,
      descricao: null,
      data_cadastro: new Date(),
    };

    it('deve criar imóvel com sucesso', async () => {
      (prisma.imovel.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.imovel.create as jest.Mock).mockResolvedValue(mockImovel);

      const result = await service.create(dto, user);

      expect(result).toEqual(mockImovel);
    });

    it('deve lançar ConflictException se endereço já existir', async () => {
      (prisma.imovel.findFirst as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(service.create(dto, user)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // =========================
  // UPLOAD IMAGENS
  // =========================
  describe('uploadImagens', () => {
    const user = { corretor_id: 1, perfil: Perfil.corretor };

    it('deve lançar BadRequestException se nenhum arquivo for enviado', async () => {
      await expect(
        service.uploadImagens(1, [], user),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
