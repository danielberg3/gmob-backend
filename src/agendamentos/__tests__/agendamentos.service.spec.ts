import { Test, TestingModule } from '@nestjs/testing';
import { AgendamentosService } from '../agendamentos.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('AgendamentosService', () => {
  let service: AgendamentosService;
  let prisma: any;

  const mockPrismaService = {
    agendamentoVisita: {
      create: jest.fn() as jest.Mock,
      findFirst: jest.fn() as jest.Mock,
      findMany: jest.fn() as jest.Mock,
      count: jest.fn() as jest.Mock,
      findUnique: jest.fn() as jest.Mock,
      update: jest.fn() as jest.Mock,
      delete: jest.fn() as jest.Mock,
      deleteMany: jest.fn() as jest.Mock,
    },
  };

  const mockCurrentUserCorretor = { perfil: 'corretor', corretor_id: 1 };
  const mockCurrentUserAdmin = { perfil: 'administrador' };
  const mockAgendamento = {
    agendamento_id: 1,
    corretor_id: 1,
    cliente_id: 2,
    imovel_id: 3,
    data_visita: new Date('2030-10-10'),
    hora_inicio: new Date('2030-10-10T10:00:00'),
    hora_termino: new Date('2030-10-10T11:00:00'),
    observacoes: 'Teste',
    status_agendamento: 'pendente',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendamentosService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AgendamentosService>(AgendamentosService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });
  
  describe('create', () => {
    const dto = {
      cliente_id: 2,
      imovel_id: 3,
      data_visita: '2030-10-10',
      hora_inicio: '10:00',
      hora_termino: '11:00',
      observacoes: 'Teste',
    };

    it('deve criar um agendamento com sucesso', async () => {
      prisma.agendamentoVisita.findFirst.mockResolvedValue(null);
      prisma.agendamentoVisita.create.mockResolvedValue(mockAgendamento);

      const result = await service.create(dto, mockCurrentUserCorretor);

      expect(prisma.agendamentoVisita.create).toHaveBeenCalled();
      expect(result).toEqual(mockAgendamento);
    });

    it('deve lançar ForbiddenException se perfil não for corretor/admin', async () => {
      await expect(
        service.create(dto, { perfil: 'cliente' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar ForbiddenException se data for passada', async () => {
      const pastDto = { ...dto, data_visita: '2000-01-01' };

      await expect(service.create(pastDto, mockCurrentUserCorretor)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar ForbiddenException se hora término <= início', async () => {
      const invalidDto = { ...dto, hora_termino: '09:00' };

      await expect(service.create(invalidDto, mockCurrentUserCorretor)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar ConflictException se já existir conflito no mesmo dia', async () => {
      prisma.agendamentoVisita.findFirst.mockResolvedValue(mockAgendamento);

      await expect(service.create(dto, mockCurrentUserCorretor)).rejects.toThrow(
        ConflictException,
      );
    });
  });
  
  describe('findAll', () => {
    it('deve retornar lista de agendamentos', async () => {
      prisma.agendamentoVisita.findMany.mockResolvedValue([mockAgendamento]);
      prisma.agendamentoVisita.count.mockResolvedValue(1);

      const result = await service.findAll(mockCurrentUserAdmin);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prisma.agendamentoVisita.findMany).toHaveBeenCalled();
    });

    it('deve lançar ForbiddenException se perfil inválido', async () => {
      await expect(service.findAll({ perfil: 'cliente' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
  
  describe('findOne', () => {
    it('deve retornar um agendamento existente', async () => {
      prisma.agendamentoVisita.findUnique.mockResolvedValue(mockAgendamento);

      const result = await service.findOne(1, mockCurrentUserAdmin);
      expect(result).toEqual(mockAgendamento);
    });

    it('deve lançar ForbiddenException se agendamento não existir', async () => {
      prisma.agendamentoVisita.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999, mockCurrentUserAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar ForbiddenException se perfil inválido', async () => {
      await expect(service.findOne(1, { perfil: 'cliente' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
  
  describe('update', () => {
    const dto = { observacoes: 'Atualizado' };

    it('deve atualizar agendamento com sucesso', async () => {
      prisma.agendamentoVisita.findFirst
        .mockResolvedValueOnce(mockAgendamento) 
        .mockResolvedValueOnce(null); 
      prisma.agendamentoVisita.update.mockResolvedValue({
        ...mockAgendamento,
        observacoes: 'Atualizado',
      });

      const result = await service.update(1, dto, mockCurrentUserCorretor);

      expect(prisma.agendamentoVisita.update).toHaveBeenCalled();
      expect(result.observacoes).toBe('Atualizado');
    });

    it('deve lançar NotFoundException se não encontrar', async () => {
      prisma.agendamentoVisita.findFirst.mockResolvedValue(null);

      await expect(service.update(999, dto, mockCurrentUserCorretor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ConflictException se houver conflito', async () => {
      prisma.agendamentoVisita.findFirst
        .mockResolvedValueOnce(mockAgendamento)
        .mockResolvedValueOnce(mockAgendamento);

      await expect(service.update(1, dto, mockCurrentUserCorretor)).rejects.toThrow(
        ConflictException,
      );
    });
  });
  
  describe('cancel', () => {
    it('deve cancelar um agendamento existente', async () => {
      prisma.agendamentoVisita.findFirst.mockResolvedValue(mockAgendamento);
      prisma.agendamentoVisita.update.mockResolvedValue({
        ...mockAgendamento,
        status_agendamento: 'cancelado',
      });

      const result = await service.cancel(1, mockCurrentUserCorretor);
      expect(result.status_agendamento).toBe('cancelado');
    });

    it('deve lançar ForbiddenException se não encontrar', async () => {
      prisma.agendamentoVisita.findFirst.mockResolvedValue(null);
      await expect(service.cancel(1, mockCurrentUserCorretor)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover um agendamento com sucesso', async () => {
      prisma.agendamentoVisita.findFirst.mockResolvedValue(mockAgendamento);
      prisma.agendamentoVisita.delete.mockResolvedValue(mockAgendamento);

      const result = await service.remove(1, mockCurrentUserAdmin);
      expect(result).toEqual(mockAgendamento);
    });

    it('deve lançar NotFoundException se não encontrar', async () => {
      prisma.agendamentoVisita.findFirst.mockResolvedValue(null);

      await expect(service.remove(1, mockCurrentUserAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  
  describe('removeByImovelId', () => {
    it('deve remover todos agendamentos de um imóvel (admin)', async () => {
      prisma.agendamentoVisita.deleteMany.mockResolvedValue({ count: 1 });

      await service.removeByImovelId(3, mockCurrentUserAdmin);
      expect(prisma.agendamentoVisita.deleteMany).toHaveBeenCalledWith({
        where: { imovel_id: 3 },
      });
    });

    it('deve lançar ForbiddenException se perfil inválido', async () => {
      await expect(service.removeByImovelId(1, { perfil: 'cliente' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
