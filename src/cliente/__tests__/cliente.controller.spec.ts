/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ClienteController } from '../cliente.controller';
import { ClienteService } from '../cliente.service';
import { CreateClienteDto, TIPO_INTERESSE } from '../dto/create-cliente.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';

describe('ClienteController', () => {
  let controller: ClienteController;
  let service: ClienteService;

  beforeEach(async () => {
    const mockClienteService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      arquivar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClienteController],
      providers: [
        {
          provide: ClienteService,
          useValue: mockClienteService,
        },
      ],
    }).compile();

    controller = module.get<ClienteController>(ClienteController);
    service = module.get<ClienteService>(ClienteService);
  });

  describe('create', () => {
    it('deve chamar o service.create com os dados corretos', async () => {
      const dto: CreateClienteDto = {
        nome_completo: 'João Silva',
        email: 'joao@email.com',
        cpf: '12345678900',
        telefone: '1199999999',
        tipo_interesse: TIPO_INTERESSE.ALUGUEL,
      };

      const mockUser = { id: 1, perfil: 'corretor' };
      const expectedResponse = { cliente_id: 1, ...dto };

      jest
        .spyOn(service, 'create')
        .mockResolvedValueOnce(expectedResponse as any);

      const result = await controller.create(dto, { user: mockUser });

      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de clientes', async () => {
      const mockUser = { perfil: 'corretor', corretor_id: 1 };
      const expectedResponse = {
        clientes: [
          {
            cliente_id: 1,
            nome: 'João Silva',
            cpf: '12345678900',
            email: 'joao@email.com',
            telefone: '1199999999',
            tipo_interesse: TIPO_INTERESSE.ALUGUEL,
            arquivado: false,
            data_cadastro: new Date(),
            corretor_id: 1,
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      jest.spyOn(service, 'findAll').mockResolvedValueOnce(expectedResponse);

      const result = await controller.findAll(
        { user: mockUser },
        'imóvel',
        '1',
        '10',
      );

      expect(service.findAll).toHaveBeenCalledWith(mockUser, 'imóvel', 1, 10);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findOne', () => {
    it('deve retornar o cliente com base no id e user', async () => {
      const mockUser = { perfil: 'corretor', corretor_id: 1 };
      const mockCliente = { cliente_id: 1, nome: 'João Silva' };

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(mockCliente as any);

      const result = await controller.findOne('1', { user: mockUser });

      expect(service.findOne).toHaveBeenCalledWith(1, mockUser);
      expect(result).toEqual(mockCliente);
    });
  });

  describe('update', () => {
    it('deve atualizar o cliente corretamente', async () => {
      const dto: UpdateClienteDto = {
        nome_completo: 'Maria Oliveira',
        cpf: '99999999999',
      };
      const mockUser = { perfil: 'corretor', corretor_id: 1 };
      const updatedCliente = { cliente_id: 1, nome: 'Maria Oliveira' };

      jest
        .spyOn(service, 'update')
        .mockResolvedValueOnce(updatedCliente as any);

      const result = await controller.update('1', dto, { user: mockUser });

      expect(service.update).toHaveBeenCalledWith(1, dto, mockUser);
      expect(result).toEqual(updatedCliente);
    });
  });

  describe('arquivar', () => {
    it('deve arquivar o cliente com sucesso', async () => {
      const mockUser = { perfil: 'corretor', corretor_id: 1 };
      const expectedResult = { cliente_id: 1, arquivado: true };

      jest
        .spyOn(service, 'arquivar')
        .mockResolvedValueOnce(expectedResult as any);

      const result = await controller.arquivar('1', { user: mockUser });

      expect(service.arquivar).toHaveBeenCalledWith(1, mockUser);
      expect(result).toEqual(expectedResult);
    });
  });
});
