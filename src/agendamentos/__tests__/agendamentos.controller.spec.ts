import { Test, TestingModule } from '@nestjs/testing';
import { AgendamentosController } from '../agendamentos.controller';
import { AgendamentosService } from '../agendamentos.service';
import { CreateAgendamentoDto } from '../dto/create-agendamento.dto';
import { UpdateAgendamentoDto } from '../dto/update-agendamento.dto';
import { StatusAgendamento, Perfil } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };
const mockAgendamentosService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('AgendamentosController', () => {
  let controller: AgendamentosController;
  let service: AgendamentosService;

  const mockUser = { perfil: Perfil.corretor, corretor_id: 1 };
  const mockRequest = { user: mockUser };
  const mockAgendamentoId = 1;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgendamentosController],
      providers: [
        { provide: AgendamentosService, useValue: mockAgendamentosService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<AgendamentosController>(AgendamentosController);
    service = module.get<AgendamentosService>(AgendamentosService);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('deve chamar o service.create com DTO e usuário logado', async () => {
      const createDto: CreateAgendamentoDto = {
        cliente_id: 1,
        imovel_id: 1,
        data_visita: '2026-02-01',
        hora_inicio: '10:00',
        hora_termino: '11:00',
        observacoes: 'Visita de prospecção',
      };
      mockAgendamentosService.create.mockResolvedValue('Agendamento Criado');

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toEqual('Agendamento Criado');
    });
  });

  describe('findAll', () => {
    it('deve chamar o service.findAll com parâmetros padrão e usuário', async () => {
      mockAgendamentosService.findAll.mockResolvedValue('Lista Padrão');

      const result = await controller.findAll(
        mockRequest,
        undefined as any,
        undefined as any,
        undefined as any,
        undefined as any,
      );

      expect(service.findAll).toHaveBeenCalledWith(
        mockUser,
        undefined,
        undefined,
        undefined,
        undefined,
        1,
        10,
      );
      expect(result).toEqual('Lista Padrão');
    });

    it('deve chamar o service.findAll com todos os parâmetros convertidos', async () => {
      mockAgendamentosService.findAll.mockResolvedValue('Lista Filtrada');

      const imovelId = '2';
      const clienteId = '5';
      const data = '2026-03-01';
      const status = StatusAgendamento.realizado;
      const page = '2';
      const limit = '5';

      const result = await controller.findAll(
        mockRequest,
        imovelId,
        clienteId,
        data,
        status,
        page,
        limit,
      );

      expect(service.findAll).toHaveBeenCalledWith(
        mockUser,
        2,
        5,
        data,
        status,
        2,
        5,
      );
      expect(result).toEqual('Lista Filtrada');
    });
  });

  describe('findOne', () => {
    it('deve chamar o service.findOne com ID e usuário logado', async () => {
      mockAgendamentosService.findOne.mockResolvedValue('Detalhe Agendamento');

      const result = await controller.findOne(mockAgendamentoId, mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(mockAgendamentoId, mockUser);
      expect(result).toEqual('Detalhe Agendamento');
    });
  });

  describe('update', () => {
    it('deve chamar o service.update com ID, DTO e usuário logado', async () => {
      const updateDto: UpdateAgendamentoDto = { observacoes: 'Novo Detalhe' };
      mockAgendamentosService.update.mockResolvedValue('Agendamento Atualizado');

      const result = await controller.update(mockAgendamentoId, updateDto, mockRequest);

      expect(service.update).toHaveBeenCalledWith(mockAgendamentoId, updateDto, mockUser);
      expect(result).toEqual('Agendamento Atualizado');
    });
  });

  describe('remove', () => {
    it('deve chamar o service.remove com ID e usuário logado', async () => {
      mockAgendamentosService.remove.mockResolvedValue('Agendamento Removido');

      const result = await controller.remove(mockAgendamentoId, mockRequest);

      expect(service.remove).toHaveBeenCalledWith(mockAgendamentoId, mockUser);
      expect(result).toEqual('Agendamento Removido');
    });
  });
});