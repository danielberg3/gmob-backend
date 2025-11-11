import { Test, TestingModule } from '@nestjs/testing';
import { TransacoesController } from '../transacoes.controller';
import { TransacoesService } from '../transacoes.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateTransacoesDto } from '../dto/create-transacoes.dto';
import { TipoTransacao } from '@prisma/client';

describe('TransacoesController', () => {
  let controller: TransacoesController;
  let service: TransacoesService;

  const mockUser = { corretor_id: 1, perfil: 'corretor' };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransacoesController],
      providers: [
        { provide: TransacoesService, useValue: mockService },
      ],
    })

      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TransacoesController>(TransacoesController);
    service = module.get<TransacoesService>(TransacoesService);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('deve criar uma nova transação', async () => {
      const dto: CreateTransacoesDto = {
        imovel_id: 1,
        cpf: '111.222.333-44',
        tipo_transacao: TipoTransacao.venda,
      };

      const mockResponse = {
        transacao: { transacao_id: 1, tipo_transacao: TipoTransacao.venda },
        agendamentosPendentes: [],
      };

      (service.create as jest.Mock).mockResolvedValue(mockResponse);

      const result = await controller.create(dto, { user: mockUser });

      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de transações com paginação', async () => {
      const mockResponse = {
        transacoesComDetalhes: [{ transacao_id: 1 }],
        pagination: { total: 1, page: 1, limit: 10 },
      };

      (service.findAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await controller.findAll({ user: mockUser }, 1, 10);

      expect(service.findAll).toHaveBeenCalledWith(mockUser, 1, 10);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma transação específica', async () => {
      const mockTransacao = { transacao_id: 1, tipo_transacao: TipoTransacao.venda };
      (service.findOne as jest.Mock).mockResolvedValue(mockTransacao);

      const result = await controller.findOne(1, { user: mockUser });

      expect(service.findOne).toHaveBeenCalledWith(1, mockUser);
      expect(result).toEqual(mockTransacao);
    });
  });

 
  describe('remove', () => {
    it('deve remover uma transação e retornar mensagem de sucesso', async () => {
      const mockResponse = { message: 'Transação removida com sucesso' };
      (service.remove as jest.Mock).mockResolvedValue(mockResponse);

      const result = await controller.remove(1, { user: mockUser });

      expect(service.remove).toHaveBeenCalledWith(1, mockUser);
      expect(result).toEqual(mockResponse);
    });
  });
});
