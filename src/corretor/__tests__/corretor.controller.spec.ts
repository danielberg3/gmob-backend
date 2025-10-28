import { Test, TestingModule } from '@nestjs/testing';
import { CorretorController } from '../corretor.controller';
import { CorretorService } from '../corretor.service';
import { CreateCorretorDto } from '../dto/create-corretor.dto';
import { UpdateCorretorDto } from '../dto/update-corretor.dto';

describe('CorretorController', () => {
  let controller: CorretorController;
  let service: CorretorService;

  const mockCorretorService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    corretor_id: 1,
    nome_completo: 'Teste',
    perfil: 'ADMIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorretorController],
      providers: [
        {
          provide: CorretorService,
          useValue: mockCorretorService,
        },
      ],
    }).compile();

    controller = module.get<CorretorController>(CorretorController);
    service = module.get<CorretorService>(CorretorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  
  describe('create', () => {
    it('deve criar um corretor', async () => {
      const dto: CreateCorretorDto = {
        nome_completo: 'Novo Corretor',
        email: 'novo@corretor.com',
        telefone: '(11) 99999-9999',
        cpf: '123.456.789-00',
        senha: '123456',
        perfil: 'corretor',
      };

      const result = { corretor_id: 10, ...dto };

      mockCorretorService.create.mockResolvedValue(result);

      const response = await controller.create(dto, { user: mockUser });

      expect(response).toEqual(result);
      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  
  describe('findAll', () => {
    it('deve retornar uma lista paginada de corretores', async () => {
      const result = {
        data: [{ corretor_id: 1, nome_completo: 'Teste' }],
        meta: { total: 1, page: 1, limit: 10 },
      };

      mockCorretorService.findAll.mockResolvedValue(result);

      const response = await controller.findAll({ user: mockUser }, 1, 10);

      expect(response).toEqual(result);
      expect(service.findAll).toHaveBeenCalledWith(mockUser, 1, 10);
    });

    it('deve aplicar valores padrão de paginação', async () => {
      const result = {
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
      };

      mockCorretorService.findAll.mockResolvedValue(result);

      const response = await controller.findAll({ user: mockUser });

      expect(response).toEqual(result);
      expect(service.findAll).toHaveBeenCalledWith(mockUser, 1, 10);
    });
  });

  
  describe('findOne', () => {
    it('deve retornar um corretor pelo ID', async () => {
      const corretor = {
        corretor_id: 5,
        nome_completo: 'Corretor Teste',
        email: 'teste@corretor.com',
      };

      mockCorretorService.findOne.mockResolvedValue(corretor);

      const response = await controller.findOne(5, { user: mockUser });

      expect(response).toEqual(corretor);
      expect(service.findOne).toHaveBeenCalledWith(5, mockUser);
    });
  });

  
  describe('update', () => {
    it('deve atualizar um corretor existente', async () => {
      const dto: UpdateCorretorDto = {
        telefone: '(11) 98888-7777',
        perfil: 'corretor',
      };

      const result = {
        corretor_id: 5,
        nome_completo: 'Corretor Atualizado',
        telefone: dto.telefone,
        perfil: dto.perfil,
      };

      mockCorretorService.update.mockResolvedValue(result);

      const response = await controller.update(5, dto, { user: mockUser });

      expect(response).toEqual(result);
      expect(service.update).toHaveBeenCalledWith(5, dto, mockUser);
    });
  });

  
  describe('remove', () => {
    it('deve remover um corretor pelo ID', async () => {
      const result = { message: 'Corretor removido com sucesso' };

      mockCorretorService.remove.mockResolvedValue(result);

      const response = await controller.remove(10, { user: mockUser });

      expect(response).toEqual(result);
      expect(service.remove).toHaveBeenCalledWith(10, mockUser);
    });
  });
});
