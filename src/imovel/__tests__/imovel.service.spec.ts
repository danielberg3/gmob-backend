/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ImovelService } from '../imovel.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransacoesService } from '../../transacoes/transacoes.service';
import { AgendamentosService } from '../../agendamentos/agendamentos.service';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Disponibilidade, Perfil, StatusImovel, Imovel, Prisma } from '@prisma/client'; // Import Prisma namespace
import { CreateImovelDto } from '../dto/create-imovel.dto';
import { UpdateImovelDto } from '../dto/update-imovel.dto';

describe('ImovelService', () => {
  let service: ImovelService;
  let prisma: PrismaService;
  let transacoesService: TransacoesService;
  let agendamentosService: AgendamentosService;

  // Mock completo do PrismaService com jest.Mock
  const mockPrismaService = {
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
    // Mock para $transaction
    $transaction: jest.fn().mockImplementation(async (prismaPromises) => {
      // Resolve as promises na ordem em que são passadas (simulação para findAll)
      if (Array.isArray(prismaPromises) && prismaPromises.length === 2) {
         // Assume que a primeira promise é findMany e a segunda é count
         const findManyResult = await mockPrismaService.imovel.findMany();
         const countResult = await mockPrismaService.imovel.count();
         return [findManyResult, countResult];
      }
      // Fallback para outros usos de transação (se houver)
      return Promise.all(prismaPromises);
    }),
  };

  const mockTransacoesService = {
    removeByImovelId: jest.fn(),
  };

  const mockAgendamentosService = {
    removeByImovelId: jest.fn(),
  };

  beforeEach(async () => {
    // Limpa todos os mocks antes de cada teste
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImovelService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TransacoesService, useValue: mockTransacoesService },
        { provide: AgendamentosService, useValue: mockAgendamentosService },
      ],
    }).compile();

    service = module.get<ImovelService>(ImovelService);
    prisma = module.get<PrismaService>(PrismaService);
    transacoesService = module.get<TransacoesService>(TransacoesService);
    agendamentosService = module.get<AgendamentosService>(AgendamentosService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // =============================================
  // CREATE
  // =============================================
  describe('create', () => {
    const user = { corretor_id: 1, perfil: Perfil.corretor };
    const createDto: CreateImovelDto = {
      tipo_imovel_id: 1,
      disponibilidade: Disponibilidade.venda,
      estado: 'Test Estado',
      cidade: 'Test Cidade',
      rua: 'Test Rua',
      numero: '123',
      valor: 100000,
      area: 50,
      numero_comodos: 2,
    };
    // Tipo Imovel ajustado para corresponder ao retorno real do Prisma
    const expectedImovel: Imovel = {
        imovel_id: 1,
        corretor_id: 1,
        tipo_imovel_id: 1,
        status: StatusImovel.disponivel, // Definido pelo service
        valor_aluguel: null, // Default
        disponibilidade: Disponibilidade.venda,
        estado: 'Test Estado',
        cidade: 'Test Cidade',
        rua: 'Test Rua',
        numero: '123',
        complemento: null, // Default
        valor: new Prisma.Decimal(100000), // Prisma retorna Decimal
        area: new Prisma.Decimal(50), // Prisma retorna Decimal
        numero_comodos: 2,
        descricao: null, // Default
        data_cadastro: new Date(),
    };


    it('deve criar um imóvel com sucesso', async () => {
      (prisma.imovel.findFirst as jest.Mock).mockResolvedValue(null); // Endereço não existe
      (prisma.imovel.create as jest.Mock).mockResolvedValue(expectedImovel);

      const result = await service.create(createDto, user);

      expect(prisma.imovel.findFirst).toHaveBeenCalledWith({
        where: {
          rua: createDto.rua,
          numero: createDto.numero,
          complemento: createDto.complemento,
          cidade: createDto.cidade,
          estado: createDto.estado,
        },
      });
      expect(prisma.imovel.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          corretor_id: user.corretor_id,
          status: StatusImovel.disponivel, // RN_06
        },
      });
      expect(result).toEqual(expectedImovel);
    });

    it('deve lançar ConflictException se o endereço já existir (RN_05)', async () => {
      (prisma.imovel.findFirst as jest.Mock).mockResolvedValue({ imovel_id: 99 }); // Endereço existe

      await expect(service.create(createDto, user)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.imovel.create).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // FIND ALL
  // =============================================
  describe('findAll', () => {
     const userCorretor = { corretor_id: 1, perfil: Perfil.corretor };
     const userAdmin = { corretor_id: 99, perfil: Perfil.administrador };
     // Tipo ajustado para incluir relações mockadas e tipo Decimal
     const mockImovelResult: Imovel & {imagens: any[], corretor?: {nome_completo: string}} = {
        imovel_id: 1, corretor_id: 1, tipo_imovel_id: 1, status: StatusImovel.disponivel, valor_aluguel: null, disponibilidade: Disponibilidade.venda, estado: 'Test', cidade: 'Test', rua: 'Test', numero: '123', complemento: null, valor: new Prisma.Decimal(100), area: new Prisma.Decimal(50), numero_comodos: 2, descricao: null, data_cadastro: new Date(),
        imagens: [], // Mock da relação
        corretor: { nome_completo: 'Corretor Teste' } // Mock da relação
     };

    it('deve retornar lista paginada de imóveis com filtros para admin', async () => {
      const queryParams = { page: 1, limit: 10, cidade: 'Test', disponibilidade: Disponibilidade.venda, valorAluguelMax: 5000 };
      // Ajuste os mocks para $transaction
      (prisma.imovel.findMany as jest.Mock).mockResolvedValue([mockImovelResult]);
      (prisma.imovel.count as jest.Mock).mockResolvedValue(1);


      const result = await service.findAll(userAdmin, queryParams);

      // Verifica as chamadas dentro da transação simulada
      expect(prisma.imovel.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          cidade: { contains: 'Test', mode: 'insensitive' },
          disponibilidade: Disponibilidade.venda,
          valor_aluguel: { lte: 5000 }
        },
        skip: 0,
        take: 10,
        include: {
          corretor: { select: { nome_completo: true } },
          imagens: true,
        },
      }));
       expect(prisma.imovel.count).toHaveBeenCalledWith({
         where: {
           cidade: { contains: 'Test', mode: 'insensitive' },
           disponibilidade: Disponibilidade.venda,
           valor_aluguel: { lte: 5000 }
         }
       });
      // Verifica a formatação do retorno
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].imagens).toBeDefined(); // Verifica se imagens está presente após map
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.lastPage).toBe(1);
    });

    it('deve filtrar por corretor_id se o usuário for corretor (RN_04)', async () => {
      const queryParams = { page: 1, limit: 5 };
      (prisma.imovel.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.imovel.count as jest.Mock).mockResolvedValue(0);

      await service.findAll(userCorretor, queryParams);

      expect(prisma.imovel.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { corretor_id: userCorretor.corretor_id }, // Filtro aplicado
        skip: 0,
        take: 5,
        include: expect.anything(),
      }));
      expect(prisma.imovel.count).toHaveBeenCalledWith({ where: { corretor_id: userCorretor.corretor_id } });
    });
  });

  // =============================================
  // FIND ONE
  // =============================================
  describe('findOne', () => {
    const userCorretor = { corretor_id: 1, perfil: Perfil.corretor };
    const userAdmin = { corretor_id: 99, perfil: Perfil.administrador };
    // Tipo ajustado com Decimal e relação
    const mockImovelResult: Imovel & { imagens: any[] } = {
        imovel_id: 1, corretor_id: 1, tipo_imovel_id: 1, status: StatusImovel.disponivel, valor_aluguel: null, disponibilidade: Disponibilidade.venda, estado: 'Test', cidade: 'Test', rua: 'Test', numero: '123', complemento: null, valor: new Prisma.Decimal(100), area: new Prisma.Decimal(50), numero_comodos: 2, descricao: null, data_cadastro: new Date(),
        imagens: [{ imagem_id: 1, url: 'test.jpg', imovel_id: 1 }],
    };

    it('deve retornar um imóvel com imagens se for o dono', async () => {
      (prisma.imovel.findUnique as jest.Mock).mockResolvedValue(mockImovelResult);

      const result = await service.findOne(1, userCorretor);

      expect(prisma.imovel.findUnique).toHaveBeenCalledWith({
        where: { imovel_id: 1 },
        include: { imagens: true },
      });
      // Verifica a desestruturação do retorno
      expect(result.imovel_id).toBe(1);
      expect(result.imagens).toBeDefined();
      expect(result.imagens).toHaveLength(1);
    });

    it('deve permitir admin acessar qualquer imóvel (RN_15)', async () => {
       const outroImovel = {...mockImovelResult, corretor_id: 2};
      (prisma.imovel.findUnique as jest.Mock).mockResolvedValue(outroImovel);

      const result = await service.findOne(1, userAdmin);
      expect(result).toBeDefined();
      expect(result.imovel_id).toBe(1);
    });

    it('deve lançar NotFoundException se imóvel não existir', async () => {
      (prisma.imovel.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(999, userCorretor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ForbiddenException se corretor não for o dono (RN_04)', async () => {
      const outroImovel = {...mockImovelResult, corretor_id: 2};
      (prisma.imovel.findUnique as jest.Mock).mockResolvedValue(outroImovel);

      await expect(service.findOne(1, userCorretor)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // =============================================
  // UPDATE
  // =============================================
  describe('update', () => {
    const user = { corretor_id: 1, perfil: Perfil.corretor };
    const updateDto: UpdateImovelDto = { descricao: 'Updated Desc', disponibilidade: Disponibilidade.ambos };
    // Tipo ajustado com Decimal e relação
    const mockImovelResult: Imovel & { imagens: any[] } = {
        imovel_id: 1, corretor_id: 1, tipo_imovel_id: 1, status: StatusImovel.disponivel, valor_aluguel: null, disponibilidade: Disponibilidade.venda, estado: 'Test', cidade: 'Test', rua: 'Test', numero: '123', complemento: null, valor: new Prisma.Decimal(100), area: new Prisma.Decimal(50), numero_comodos: 2, descricao: null, data_cadastro: new Date(),
        imagens: [],
    };
    const updatedImovelResult = { ...mockImovelResult, ...updateDto };

    it('deve atualizar o imóvel com sucesso se for o dono', async () => {
      // Mock findOne interno precisa retornar o objeto completo ANTES da atualização
      (prisma.imovel.findUnique as jest.Mock).mockResolvedValue(mockImovelResult);
      (prisma.imovel.update as jest.Mock).mockResolvedValue(updatedImovelResult);

      const result = await service.update(1, updateDto, user);

      // Verifica se findOne foi chamado corretamente
      expect(prisma.imovel.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { imovel_id: 1 } }));
      // Verifica se update foi chamado corretamente
      expect(prisma.imovel.update).toHaveBeenCalledWith({
        where: { imovel_id: 1 },
        data: updateDto,
      });
      expect(result.descricao).toBe('Updated Desc');
      expect(result.disponibilidade).toBe(Disponibilidade.ambos);
    });

    it('deve lançar ForbiddenException se corretor não for o dono', async () => {
        const outroImovel = {...mockImovelResult, corretor_id: 2};
        (prisma.imovel.findUnique as jest.Mock).mockResolvedValue(outroImovel); // Mock para o findOne interno

        await expect(service.update(1, updateDto, user)).rejects.toThrow(ForbiddenException);
        expect(prisma.imovel.update).not.toHaveBeenCalled();
    });

     it('deve lançar NotFoundException se imóvel não existir', async () => {
       (prisma.imovel.findUnique as jest.Mock).mockResolvedValue(null); // Mock para o findOne interno
       await expect(service.update(999, updateDto, user)).rejects.toThrow(NotFoundException);
     });
  });

  // =============================================
  // REMOVE
  // =============================================
  describe('remove', () => {
      const user = { corretor_id: 1, perfil: Perfil.corretor };
      // Tipo ajustado com Decimal e relação
      const mockImovelResult: Imovel & { imagens: any[] } = {
        imovel_id: 1, corretor_id: 1, tipo_imovel_id: 1, status: StatusImovel.disponivel, valor_aluguel: null, disponibilidade: Disponibilidade.venda, estado: 'Test', cidade: 'Test', rua: 'Test', numero: '123', complemento: null, valor: new Prisma.Decimal(100), area: new Prisma.Decimal(50), numero_comodos: 2, descricao: null, data_cadastro: new Date(),
        imagens: [],
    };

    it('deve remover o imóvel com sucesso se não houver transações', async () => {
      (prisma.imovel.findUnique as jest.Mock).mockResolvedValue(mockImovelResult); // Mock findOne
      (prisma.transacaoImovel.findFirst as jest.Mock).mockResolvedValue(null); // Nenhuma transação
      (prisma.imovel.delete as jest.Mock).mockResolvedValue(mockImovelResult);

      await service.remove(1, user);

      expect(prisma.imovel.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { imovel_id: 1 } }));
      expect(prisma.transacaoImovel.findFirst).toHaveBeenCalledWith({ where: { imovel_id: 1 } });
      expect(mockAgendamentosService.removeByImovelId).toHaveBeenCalledWith(1, user);
      expect(prisma.imagemImovel.deleteMany).toHaveBeenCalledWith({ where: { imovel_id: 1 } });
      expect(prisma.imovel.delete).toHaveBeenCalledWith({ where: { imovel_id: 1 } });
    });

    it('deve lançar ConflictException se existirem transações (RN_25)', async () => {
      (prisma.imovel.findUnique as jest.Mock).mockResolvedValue(mockImovelResult); // Mock findOne
      (prisma.transacaoImovel.findFirst as jest.Mock).mockResolvedValue({ transacao_id: 1 }); // Transação existe

      await expect(service.remove(1, user)).rejects.toThrow(ConflictException);
      expect(mockAgendamentosService.removeByImovelId).not.toHaveBeenCalled();
      expect(prisma.imagemImovel.deleteMany).not.toHaveBeenCalled();
      expect(prisma.imovel.delete).not.toHaveBeenCalled();
    });

    it('deve lançar ForbiddenException se corretor não for o dono', async () => {
       const outroImovel = {...mockImovelResult, corretor_id: 2};
      (prisma.imovel.findUnique as jest.Mock).mockResolvedValue(outroImovel); // Mock findOne

      await expect(service.remove(1, user)).rejects.toThrow(ForbiddenException);
    });
  });

  // =============================================
  // UPLOAD IMAGENS
  // =============================================
  describe('uploadImagens', () => {
    const user = { corretor_id: 1, perfil: Perfil.corretor };
    const mockFiles = [
      { originalname: 'test1.jpg', buffer: Buffer.from('test1') }, // Buffer adicionado para simular Multer.File
      { originalname: 'test2.png', buffer: Buffer.from('test2') },
    ] as Array<Express.Multer.File>;
     // Tipo ajustado com Decimal e relação
     const mockImovelResult: Imovel & { imagens: any[] } = {
        imovel_id: 1, corretor_id: 1, tipo_imovel_id: 1, status: StatusImovel.disponivel, valor_aluguel: null, disponibilidade: Disponibilidade.venda, estado: 'Test', cidade: 'Test', rua: 'Test', numero: '123', complemento: null, valor: new Prisma.Decimal(100), area: new Prisma.Decimal(50), numero_comodos: 2, descricao: null, data_cadastro: new Date(),
        imagens: [],
    };

    it('deve fazer upload das imagens e salvar referências com sucesso', async () => {
      (prisma.imovel.findUnique as jest.Mock).mockResolvedValue(mockImovelResult); // Mock findOne
      (prisma.imagemImovel.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await service.uploadImagens(1, mockFiles, user);

      expect(prisma.imovel.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { imovel_id: 1 } }));
      expect(prisma.imagemImovel.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ imovel_id: 1, url: expect.stringContaining('test1.jpg') }),
          expect.objectContaining({ imovel_id: 1, url: expect.stringContaining('test2.png') }),
        ]),
      });
      expect(result.message).toContain('2 imagens salvas com sucesso');
    });

    it('deve lançar BadRequestException se nenhum arquivo for enviado', async () => {
      await expect(service.uploadImagens(1, [], user)).rejects.toThrow(BadRequestException);
    });

     it('deve lançar ForbiddenException se corretor não for o dono', async () => {
       const outroImovel = {...mockImovelResult, corretor_id: 2};
      (prisma.imovel.findUnique as jest.Mock).mockResolvedValue(outroImovel); // Mock findOne

      await expect(service.uploadImagens(1, mockFiles, user)).rejects.toThrow(ForbiddenException);
     });
  });
});

