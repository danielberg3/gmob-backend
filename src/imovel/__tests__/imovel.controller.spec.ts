import { Test, TestingModule } from '@nestjs/testing';
import { ImovelController } from '../imovel.controller';
import { ImovelService } from '../imovel.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CreateImovelDto } from '../dto/create-imovel.dto';
import { UpdateImovelDto } from '../dto/update-imovel.dto';
import { Perfil, Disponibilidade } from '@prisma/client';

// =========================
// Mocks
// =========================
const mockImovelService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  uploadImagens: jest.fn(),
};

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockRolesGuard = {
  canActivate: jest.fn(() => true),
};

describe('ImovelController', () => {
  let controller: ImovelController;
  let service: ImovelService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImovelController],
      providers: [
        {
          provide: ImovelService,
          useValue: mockImovelService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<ImovelController>(ImovelController);
    service = module.get<ImovelService>(ImovelService);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  // =========================
  // CREATE
  // =========================
  describe('create', () => {
    const dto: CreateImovelDto = {
      tipo_imovel_id: 1,
      disponibilidade: Disponibilidade.venda,
      estado: 'SP',
      cidade: 'São Paulo',
      rua: 'Rua Teste',
      numero: '123',
      valor: 100000,
      area: 80,
      numero_comodos: 3,
    };

    const req = {
      user: { corretor_id: 1, perfil: Perfil.corretor },
    };

    const response = {
      imovel_id: 1,
      corretor_id: 1,
      status: 'disponivel',
      ...dto,
    };

    it('deve criar um imóvel', async () => {
      mockImovelService.create.mockResolvedValue(response);

      const result = await controller.create(dto, req as any);

      expect(service.create).toHaveBeenCalledWith(dto, req.user);
      expect(result).toEqual(response);
    });
  });

  // =========================
  // UPLOAD IMAGENS
  // =========================
  describe('uploadImagens', () => {
    const req = {
      user: { corretor_id: 1, perfil: Perfil.corretor },
    };

    const files = [
      {
        originalname: 'img1.jpg',
        buffer: Buffer.from('test'),
      },
    ] as Express.Multer.File[];

    const response = {
      message: 'Imagens vinculadas ao imóvel com sucesso.',
      total: 1,
    };

    it('deve realizar o upload das imagens', async () => {
      mockImovelService.uploadImagens.mockResolvedValue(response);

      const result = await controller.uploadImagens(1, files, req as any);

      expect(service.uploadImagens).toHaveBeenCalledWith(1, files, req.user);
      expect(result).toEqual(response);
    });
  });

  // =========================
  // FIND ALL
  // =========================
  describe('findAll', () => {
    const req = {
      user: { corretor_id: 1, perfil: Perfil.corretor },
    };

    const query = {
      page: '1',
      limit: '10',
    };

    const response = {
      data: [],
      total: 0,
      page: 1,
      lastPage: 0,
    };

    it('deve listar imóveis', async () => {
      mockImovelService.findAll.mockResolvedValue(response);

      const result = await controller.findAll(req as any, query);

      expect(service.findAll).toHaveBeenCalledWith(req.user, query);
      expect(result).toEqual(response);
    });
  });

  // =========================
  // FIND ONE
  // =========================
  describe('findOne', () => {
    const req = {
      user: { corretor_id: 1, perfil: Perfil.corretor },
    };

    const response = {
      imovel_id: 1,
      imagens: [],
    };

    it('deve buscar um imóvel por id', async () => {
      mockImovelService.findOne.mockResolvedValue(response);

      const result = await controller.findOne(1, req as any);

      expect(service.findOne).toHaveBeenCalledWith(1, req.user);
      expect(result).toEqual(response);
    });
  });

  // =========================
  // UPDATE
  // =========================
  describe('update', () => {
    const req = {
      user: { corretor_id: 1, perfil: Perfil.corretor },
    };

    const dto: UpdateImovelDto = {
      descricao: 'Atualizado',
    };

    const response = {
      imovel_id: 1,
      descricao: 'Atualizado',
    };

    it('deve atualizar um imóvel', async () => {
      mockImovelService.update.mockResolvedValue(response);

      const result = await controller.update(1, dto, req as any);

      expect(service.update).toHaveBeenCalledWith(1, dto, req.user);
      expect(result).toEqual(response);
    });
  });

  // =========================
  // REMOVE
  // =========================
  describe('remove', () => {
    const req = {
      user: { corretor_id: 1, perfil: Perfil.corretor },
    };

    const response = {
      message: 'Imóvel removido com sucesso.',
    };

    it('deve remover um imóvel', async () => {
      mockImovelService.remove.mockResolvedValue(response);

      const result = await controller.remove(1, req as any);

      expect(service.remove).toHaveBeenCalledWith(1, req.user);
      expect(result).toEqual(response);
    });
  });
});
