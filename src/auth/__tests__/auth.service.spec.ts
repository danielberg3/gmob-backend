import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Perfil } from '@prisma/client';
import { RegisterDto } from '../dto/register.dto';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let cacheService: CacheService;
  let jwtService: JwtService;

  const mockPrismaService = {
    corretor: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockCacheService = {
    getLoginAttempts: jest.fn(),
    setLoginAttempts: jest.fn(),
    removeLoginAttempts: jest.fn(),
    setToken: jest.fn(),
    removeToken: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });



  describe('register', () => {
    const dto: RegisterDto = {
      nome_completo: 'teste',
      email: 'teste@email.com',
      telefone: '(11) 99999-9999',
      cpf: '123.456.789-00',
      senha: '123456',
      perfil: Perfil.corretor,
    };

    it('deve lançar erro se email já estiver em uso', async () => {
      mockPrismaService.corretor.findUnique
        .mockResolvedValueOnce({ email: dto.email }); // email duplicado

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.corretor.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
    });

    it('deve lançar erro se CPF já estiver em uso', async () => {
      mockPrismaService.corretor.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ cpf: dto.cpf }); // cpf duplicado

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('deve criar um novo corretor com sucesso', async () => {
      mockPrismaService.corretor.findUnique.mockResolvedValueOnce(null); // email ok
      mockPrismaService.corretor.findUnique.mockResolvedValueOnce(null); // cpf ok

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const corretorCriado = {
        corretor_id: 1,
        nome_completo: dto.nome_completo,
        email: dto.email,
        telefone: dto.telefone,
        cpf: dto.cpf,
        perfil: dto.perfil,
        data_cadastro: new Date(),
      };

      mockPrismaService.corretor.create.mockResolvedValue(corretorCriado);

      const result = await service.register(dto);

      expect(result).toEqual({
        message: 'Corretor registrado com sucesso',
        corretor: corretorCriado,
      });

      expect(mockPrismaService.corretor.create).toHaveBeenCalledWith({
        data: {
          nome_completo: dto.nome_completo,
          email: dto.email,
          telefone: dto.telefone,
          cpf: dto.cpf,
          senha: 'hashedPassword',
          perfil: dto.perfil,
        },
        select: expect.any(Object),
      });
    });
  });



  describe('validateUser', () => {
    const email = 'user@email.com';
    const senha = '123456';
    const user = { email, senha: 'hashedPassword', corretor_id: 1 };

    it('deve lançar erro se houver mais de 5 tentativas de login', async () => {
      mockCacheService.getLoginAttempts.mockResolvedValue(5);

      await expect(service.validateUser(email, senha)).rejects.toThrow(BadRequestException);
    });

    it('deve retornar o usuário se senha for válida', async () => {
      mockCacheService.getLoginAttempts.mockResolvedValue(0);
      mockPrismaService.corretor.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, senha);

      expect(result).toEqual({ email, corretor_id: 1 });
      expect(cacheService.removeLoginAttempts).toHaveBeenCalledWith(email);
    });

    it('deve incrementar tentativas se senha for inválida', async () => {
      mockCacheService.getLoginAttempts.mockResolvedValue(1);
      mockPrismaService.corretor.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(email, senha);

      expect(result).toBeNull();
      expect(cacheService.setLoginAttempts).toHaveBeenCalledWith(email, 2, 900);
    });
  });



  describe('login', () => {
    const user = {
      corretor_id: 1,
      email: 'user@email.com',
      nome_completo: 'teste',
      telefone: '(11) 99999-9999',
      cpf: '123.456.789-00',
      perfil: Perfil.corretor,
      data_cadastro: new Date(),
    };

    it('deve gerar token JWT', async () => {
      (jwtService.sign as jest.Mock).mockReturnValue('jwt_token');

      const result = await service.login(user);

      expect(result.access_token).toBe('jwt_token');
      expect(result.user).toEqual({
        corretor_id: user.corretor_id,
        nome_completo: user.nome_completo,
        email: user.email,
        telefone: user.telefone,
        cpf: user.cpf,
        perfil: user.perfil,
        data_cadastro: user.data_cadastro,
      });
      expect(cacheService.setToken).toHaveBeenCalledWith(
        user.corretor_id,
        'jwt_token',
        7 * 24 * 3600,
      );
    });
  });



  describe('logout', () => {
    it('deve remover o token do Redis', async () => {
      const result = await service.logout(1);

      expect(cacheService.removeToken).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Logout realizado com sucesso' });
    });
  });



  describe('getProfile', () => {
    it('deve retornar o perfil do usuário', async () => {
      const user = { corretor_id: 1, nome_completo: 'teste' };
      mockPrismaService.corretor.findUnique.mockResolvedValue(user);

      const result = await service.getProfile(1);
      expect(result).toEqual(user);
    });

    it('deve lançar erro se usuário não for encontrado', async () => {
      mockPrismaService.corretor.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(99)).rejects.toThrow(UnauthorizedException);
    });
  });
});