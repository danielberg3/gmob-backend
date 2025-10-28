import { Test, TestingModule } from '@nestjs/testing';
import { ImovelController } from '../imovel.controller';
import { ImovelService } from '../imovel.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CreateImovelDto } from '../dto/create-imovel.dto';
import { UpdateImovelDto } from '../dto/update-imovel.dto';
import { Perfil, Disponibilidade } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

// Mock do ImovelService - Simulamos o comportamento do serviço
const mockImovelService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  uploadImagens: jest.fn(),
};

// Mock simples para os Guards (apenas para permitir a execução)
const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };

describe('ImovelController', () => {
  let controller: ImovelController;
  let service: ImovelService;

  beforeEach(async () => {
    // Limpa mocks antes de cada teste
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImovelController],
      providers: [
        { provide: ImovelService, useValue: mockImovelService },
      ],
    })
    // Sobrescreve os Guards com mocks
    .overrideGuard(JwtAuthGuard).useValue(mockJwtAuthGuard)
    .overrideGuard(RolesGuard).useValue(mockRolesGuard)
    .compile();

    controller = module.get<ImovelController>(ImovelController);
    service = module.get<ImovelService>(ImovelService);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  // =============================================
  // CREATE (POST /)
  // =============================================
  describe('create', () => {
    const createDto: CreateImovelDto = {
        tipo_imovel_id: 1,
        disponibilidade: Disponibilidade.venda,
        estado: 'Test', cidade: 'Test', rua: 'Test', numero: '123',
        valor: 100, area: 50, numero_comodos: 2
    };
    const mockReq = { user: { corretor_id: 1, perfil: Perfil.corretor } };
    const mockCreatedImovel = { imovel_id: 1, ...createDto, corretor_id: 1, status: 'disponivel' };

    it('deve chamar imovelService.create com os dados corretos e retornar o imóvel criado', async () => {
      mockImovelService.create.mockResolvedValue(mockCreatedImovel);

      const result = await controller.create(createDto, mockReq);

      expect(service.create).toHaveBeenCalledWith(createDto, mockReq.user);
      expect(result).toEqual(mockCreatedImovel);
    });
  });

  // =============================================
  // UPLOAD IMAGENS (POST /:id/imagens)
  // =============================================
  describe('uploadImagens', () => {
     const mockReq = { user: { corretor_id: 1, perfil: Perfil.corretor } };
     const mockFiles = [{ originalname: 'test.jpg' }] as Array<Express.Multer.File>;
     const mockImovelId = 1;
     const mockSuccessResponse = { message: '1 imagens salvas com sucesso.'};

     it('deve chamar imovelService.uploadImagens com id, files e user', async () => {
        mockImovelService.uploadImagens.mockResolvedValue(mockSuccessResponse);

        const result = await controller.uploadImagens(mockImovelId, mockFiles, mockReq);

        expect(service.uploadImagens).toHaveBeenCalledWith(mockImovelId, mockFiles, mockReq.user);
        expect(result).toEqual(mockSuccessResponse);
     });

     // Teste para verificar se o FilesInterceptor está aplicado (indiretamente)
     // Não podemos testar o interceptor diretamente aqui, mas podemos testar
     // o comportamento esperado se nenhum arquivo for enviado (o service lançaria erro)
     it('deve repassar a chamada mesmo se files for vazio (o service trata)', async () => {
        const emptyFiles = [];
        // Suponha que o service lança BadRequestException se files for vazio
        mockImovelService.uploadImagens.mockRejectedValue(new BadRequestException('Nenhum arquivo enviado.'));

        await expect(controller.uploadImagens(mockImovelId, emptyFiles, mockReq))
              .rejects.toThrow(BadRequestException);

        expect(service.uploadImagens).toHaveBeenCalledWith(mockImovelId, emptyFiles, mockReq.user);
     });
  });

  // =============================================
  // FIND ALL (GET /)
  // =============================================
  describe('findAll', () => {
    const mockReq = { user: { corretor_id: 1, perfil: Perfil.corretor } };
    const mockQueryParams = { page: '1', limit: '10', cidade: 'Test' };
    const mockServiceResponse = { data: [], total: 0, page: 1, lastPage: 0 };

    it('deve chamar imovelService.findAll com user e queryParams', async () => {
      mockImovelService.findAll.mockResolvedValue(mockServiceResponse);

      const result = await controller.findAll(mockReq, mockQueryParams);

      expect(service.findAll).toHaveBeenCalledWith(mockReq.user, mockQueryParams);
      expect(result).toEqual(mockServiceResponse);
    });
  });

  // =============================================
  // FIND ONE (GET /:id)
  // =============================================
  describe('findOne', () => {
     const mockReq = { user: { corretor_id: 1, perfil: Perfil.corretor } };
     const mockImovelId = 1;
     const mockServiceResponse = { imovel_id: 1, /* ... outros dados ... */ imagens: [] };

     it('deve chamar imovelService.findOne com id e user', async () => {
        mockImovelService.findOne.mockResolvedValue(mockServiceResponse);

        const result = await controller.findOne(mockImovelId, mockReq);

        expect(service.findOne).toHaveBeenCalledWith(mockImovelId, mockReq.user);
        expect(result).toEqual(mockServiceResponse);
     });
  });

  // =============================================
  // UPDATE (PATCH /:id)
  // =============================================
  describe('update', () => {
      const mockReq = { user: { corretor_id: 1, perfil: Perfil.corretor } };
      const mockImovelId = 1;
      const updateDto: UpdateImovelDto = { descricao: 'Updated' };
      const mockServiceResponse = { imovel_id: 1, descricao: 'Updated' };

      it('deve chamar imovelService.update com id, dto e user', async () => {
          mockImovelService.update.mockResolvedValue(mockServiceResponse);

          const result = await controller.update(mockImovelId, updateDto, mockReq);

          expect(service.update).toHaveBeenCalledWith(mockImovelId, updateDto, mockReq.user);
          expect(result).toEqual(mockServiceResponse);
      });
  });

  // =============================================
  // REMOVE (DELETE /:id)
  // =============================================
  describe('remove', () => {
      const mockReq = { user: { corretor_id: 1, perfil: Perfil.corretor } };
      const mockImovelId = 1;
      const mockServiceResponse = { imovel_id: 1, /* ... */ };

      it('deve chamar imovelService.remove com id e user', async () => {
          mockImovelService.remove.mockResolvedValue(mockServiceResponse);

          const result = await controller.remove(mockImovelId, mockReq);

          expect(service.remove).toHaveBeenCalledWith(mockImovelId, mockReq.user);
          expect(result).toEqual(mockServiceResponse);
      });
  });

});
