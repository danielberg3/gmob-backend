import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CorretorService } from '../corretor.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('CorretorService', () => {
  let service: CorretorService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrisma = {
    corretor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAdmin = { corretor_id: 1, perfil: 'administrador' };
  const mockCorretor = { corretor_id: 2, perfil: 'corretor' };

  beforeEach(() => {
    prismaService = mockPrisma as any;
    service = new CorretorService(prismaService);
    jest.clearAllMocks();
  });

  
  describe('create', () => {
    const dto = {
      nome_completo: 'João da Silva',
      email: 'joao@email.com',
      telefone: '(11) 99999-9999',
      cpf: '123.456.789-00',
      senha: '123456',
    };

    it('deve lançar ForbiddenException se o usuário não for administrador', async () => {
      await expect(service.create(dto, mockCorretor)).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar ConflictException se o email já existir', async () => {
      (prismaService.corretor.findUnique as jest.Mock).mockImplementation(({ where }) => {
        if (where.email) return Promise.resolve({ email: dto.email });
        if (where.cpf) return Promise.resolve(null);
        return Promise.resolve(null);
      });
      await expect(service.create(dto, mockAdmin)).rejects.toThrow(ConflictException);
    });

    it('deve lançar ConflictException se o CPF já existir', async () => {
      (prismaService.corretor.findUnique as jest.Mock).mockImplementation(({ where }) => {
        if (where.email) return Promise.resolve(null);
        if (where.cpf) return Promise.resolve({ cpf: dto.cpf });
        return Promise.resolve(null);
      });
      await expect(service.create(dto, mockAdmin)).rejects.toThrow(ConflictException);
    });

    it('deve criar o corretor com sucesso', async () => {
      (prismaService.corretor.findUnique as jest.Mock).mockImplementation(() => Promise.resolve(null));
      (prismaService.corretor.create as jest.Mock).mockResolvedValue({
        corretor_id: 1,
        ...dto,
        senha: undefined,
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed123');

      const result = await service.create(dto, mockAdmin);
      expect(result).toHaveProperty('corretor_id');
      expect(prismaService.corretor.create).toHaveBeenCalled();
    });
  });

  
  describe('findAll', () => {
    it('deve lançar ForbiddenException se o usuário não for administrador', async () => {
      await expect(service.findAll(mockCorretor)).rejects.toThrow(ForbiddenException);
    });

    it('deve retornar lista de corretores com paginação', async () => {
      (prismaService.corretor.findMany as jest.Mock).mockResolvedValue([{ corretor_id: 1 }]);
      (prismaService.corretor.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll(mockAdmin, 1, 10);
      expect(result).toHaveProperty('corretores');
      expect(result.pagination.totalPages).toBe(1);
    });
  });

  
  describe('findOne', () => {
    it('deve lançar ForbiddenException se corretor tentar acessar outro perfil', async () => {
      await expect(service.findOne(99, mockCorretor)).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar NotFoundException se corretor não existir', async () => {
      (prismaService.corretor.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(1, mockAdmin)).rejects.toThrow(NotFoundException);
    });

    it('deve retornar corretor se encontrado', async () => {
      (prismaService.corretor.findUnique as jest.Mock).mockResolvedValue({ corretor_id: 1 });
      const result = await service.findOne(1, mockAdmin);
      expect(result).toHaveProperty('corretor_id');
    });
  });

  
  describe('update', () => {
    const dto = { nome_completo: 'Novo Nome', email: 'novo@email.com' };

    it('deve lançar ForbiddenException se corretor tentar atualizar outro perfil', async () => {
      await expect(service.update(99, dto, mockCorretor)).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar NotFoundException se corretor não existir', async () => {
      (prismaService.corretor.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.update(1, dto, mockAdmin)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException se email já existir', async () => {
      (prismaService.corretor.findUnique as jest.Mock).mockImplementation(({ where }) => {
        if (where.corretor_id) return Promise.resolve({ corretor_id: 1, email: 'old@email.com', cpf: '123.456.789-00' });
        if (where.email) return Promise.resolve({ email: dto.email });
        return Promise.resolve(null);
      });
      await expect(service.update(1, dto, mockAdmin)).rejects.toThrow(ConflictException);
    });

    it('deve atualizar corretor com sucesso', async () => {
      (prismaService.corretor.findUnique as jest.Mock).mockImplementation(({ where }) => {
        if (where.corretor_id) return Promise.resolve({ corretor_id: 1, email: 'old@email.com', cpf: '123.456.789-00' });
        if (where.email) return Promise.resolve(null);
        return Promise.resolve(null);
      });
      (prismaService.corretor.update as jest.Mock).mockResolvedValue({ corretor_id: 1, ...dto });

      const result = await service.update(1, dto, mockAdmin);
      expect(result.email).toBe(dto.email);
    });
  });

  
  describe('remove', () => {
    it('deve lançar ForbiddenException se o usuário não for administrador', async () => {
      await expect(service.remove(1, mockCorretor)).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar NotFoundException se corretor não existir', async () => {
      (prismaService.corretor.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.remove(1, mockAdmin)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException se tentar remover a si mesmo', async () => {
      (prismaService.corretor.findUnique as jest.Mock).mockResolvedValue({ corretor_id: 1 });
      await expect(service.remove(1, mockAdmin)).rejects.toThrow(ForbiddenException);
    });

    it('deve remover corretor com sucesso', async () => {
      (prismaService.corretor.findUnique as jest.Mock).mockResolvedValue({ corretor_id: 2 });
      (prismaService.corretor.delete as jest.Mock).mockResolvedValue({});

      const result = await service.remove(2, mockAdmin);
      expect(result.message).toBe('Corretor removido com sucesso');
    });
  });
});
