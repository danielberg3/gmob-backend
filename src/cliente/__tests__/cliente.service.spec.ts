/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ClienteService } from '../cliente.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClienteDto, TIPO_INTERESSE } from '../dto/create-cliente.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';

describe('ClienteService', () => {
  let service: ClienteService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mockPrismaService = {
      cliente: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClienteService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClienteService>(ClienteService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    const dto: CreateClienteDto = {
      nome_completo: 'João Silva',
      email: 'joao@email.com',
      cpf: '12345678900',
      telefone: '1199999999',
      tipo_interesse: TIPO_INTERESSE.COMPRA,
    };

    const user = { perfil: 'corretor', corretor_id: 1 };

    it('deve criar cliente se o usuário for corretor e não houver duplicidade', async () => {
      (prisma.cliente.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // email ok
        .mockResolvedValueOnce(null); // cpf ok

      (prisma.cliente.create as jest.Mock).mockResolvedValueOnce({
        cliente_id: 1,
        ...dto,
      });

      const result = await service.create(dto, user);

      expect(prisma.cliente.create).toHaveBeenCalledWith({
        data: {
          corretor_id: 1,
          nome: dto.nome_completo,
          email: dto.email,
          cpf: dto.cpf,
          telefone: dto.telefone,
          tipo_interesse: dto.tipo_interesse,
        },
      });
      expect(result).toEqual({ cliente_id: 1, ...dto });
    });

    it('deve lançar Forbidden se o perfil não for corretor nem administrador', async () => {
      const invalidUser = { perfil: 'cliente' };
      await expect(service.create(dto, invalidUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar Forbidden se já existir cliente com o mesmo email', async () => {
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce({
        cliente_id: 1,
      });
      await expect(service.create(dto, user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar Forbidden se já existir cliente com o mesmo CPF', async () => {
      (prisma.cliente.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ cliente_id: 2 });
      await expect(service.create(dto, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ==========================================================
  // FIND ALL
  // ==========================================================
  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      (prisma.cliente.findMany as jest.Mock).mockResolvedValueOnce([
        { cliente_id: 1 },
      ]);
      (prisma.cliente.count as jest.Mock).mockResolvedValueOnce(1);

      const user = { perfil: 'corretor', corretor_id: 1 };
      const result = await service.findAll(user, '', 1, 10);

      expect(prisma.cliente.findMany).toHaveBeenCalled();
      expect(result.pagination.totalPages).toBe(1);
      expect(result.clientes).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    const user = { perfil: 'corretor', corretor_id: 1 };

    it('deve retornar o cliente se for o dono', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce({
        cliente_id: 1,
        corretor_id: 1,
      });

      const result = await service.findOne(1, user);
      expect(result).toBeDefined();
    });

    it('deve permitir admin acessar qualquer cliente', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce({
        cliente_id: 1,
        corretor_id: 999,
      });
      const result = await service.findOne(1, { perfil: 'administrador' });
      expect(result).toBeDefined();
    });

    it('deve lançar NotFound se cliente não existir', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.findOne(1, user)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar Forbidden se não for dono nem admin', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce({
        cliente_id: 1,
        corretor_id: 2,
      });
      await expect(service.findOne(1, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    const user = { perfil: 'corretor', corretor_id: 1 };
    const dto: UpdateClienteDto = {
      nome_completo: 'Maria',
      cpf: '99999999999',
    };

    it('deve atualizar cliente se for dono', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce({
        cliente_id: 1,
        corretor_id: 1,
      });
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (prisma.cliente.update as jest.Mock).mockResolvedValueOnce({
        cliente_id: 1,
        nome: 'Maria',
      });

      const result = await service.update(1, dto, user);
      expect(result).toEqual({ cliente_id: 1, nome: 'Maria' });
    });

    it('deve lançar Forbidden se não for dono nem admin', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce({
        cliente_id: 1,
        corretor_id: 2,
      });
      await expect(service.update(1, dto, user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar NotFound se cliente não existir', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.update(1, dto, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar Forbidden se CPF já existir', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce({
        cliente_id: 1,
        corretor_id: 1,
      });
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce({
        cliente_id: 2,
      });
      await expect(service.update(1, dto, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('arquivar', () => {
    const user = { perfil: 'corretor', corretor_id: 1 };

    it('deve arquivar cliente se for dono', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce({
        cliente_id: 1,
        corretor_id: 1,
      });
      (prisma.cliente.update as jest.Mock).mockResolvedValueOnce({
        cliente_id: 1,
        arquivado: true,
      });

      const result = await service.arquivar(1, user);
      expect(result.arquivado).toBe(true);
    });

    it('deve lançar NotFound se cliente não existir', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.arquivar(1, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar Forbidden se não for dono nem admin', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce({
        cliente_id: 1,
        corretor_id: 2,
      });
      await expect(service.arquivar(1, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findByCpf', () => {
    it('deve retornar cliente se CPF existir', async () => {
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce({
        cliente_id: 1,
      });
      const result = await service.findByCpf('123');
      expect(result).toEqual({ cliente_id: 1 });
    });

    it('deve lançar NotFound se CPF não encontrado', async () => {
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.findByCpf('000')).rejects.toThrow(NotFoundException);
    });
  });
});
