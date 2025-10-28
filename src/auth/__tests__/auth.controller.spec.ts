import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RegisterDto } from '../dto/register.dto';
import { Perfil } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve registrar um novo corretor', async () => {
      const dto: RegisterDto = {
        nome_completo: 'Daniel Berg',
        email: 'daniel@email.com',
        telefone: '(11) 99999-9999',
        cpf: '123.456.789-00',
        senha: '123456',
        perfil: Perfil.corretor,
      };

      const result = { id: 1, ...dto };

      mockAuthService.register.mockResolvedValue(result);

      const response = await controller.register(dto);
      expect(response).toEqual(result);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('deve fazer login e retornar o token JWT', async () => {
      const user = { corretor_id: 1, nome_completo: 'Daniel Berg' };
      const token = { access_token: 'jwt_token' };

      mockAuthService.login.mockResolvedValue(token);

      const response = await controller.login({ user });
      expect(response).toEqual(token);
      expect(authService.login).toHaveBeenCalledWith(user);
    });
  });

  describe('logout', () => {
    it('deve fazer logout do corretor autenticado', async () => {
      const user = { corretor_id: 1 };
      const result = { success: true };

      mockAuthService.logout.mockResolvedValue(result);

      const response = await controller.logout({ user });
      expect(response).toEqual(result);
      expect(authService.logout).toHaveBeenCalledWith(user.corretor_id);
    });
  });

  describe('getProfile', () => {
    it('deve retornar o perfil do corretor autenticado', async () => {
      const user = { corretor_id: 1 };
      const profile = {
        corretor_id: 1,
        nome_completo: 'Daniel Berg',
        email: 'daniel@email.com',
      };

      mockAuthService.getProfile.mockResolvedValue(profile);

      const response = await controller.getProfile({ user });
      expect(response).toEqual(profile);
      expect(authService.getProfile).toHaveBeenCalledWith(user.corretor_id);
    });
  });
});
