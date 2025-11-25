import { Test, TestingModule } from '@nestjs/testing';
import { MetricasController } from '../metricas.controller';
import { MetricasService } from '../metricas.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('MetricasController', () => {
  let controller: MetricasController;
  let service: MetricasService;

  const mockMetricasService = {
    getMetricas: jest.fn(),
  };

  const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };

  const mockUser = { corretor_id: 1, perfil: 'corretor' };
  const mockReq = { user: mockUser };

  const mockMetricasResponse = {
    imoveisDisponiveis: 10,
    imoveisVendidos: 5,
    imoveisAlugados: 2,
    totalClientes: 20,
    totalTransacoes: 7,
    totalVendas: 1000000,
    comissaoVendas: 50000,
    comissaoAluguel: 2000,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricasController],
      providers: [
        { provide: MetricasService, useValue: mockMetricasService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<MetricasController>(MetricasController);
    service = module.get<MetricasService>(MetricasService);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetricas', () => {
    it('deve chamar o service.getMetricas com o utilizador correto e retornar o resultado', async () => {
      // Configurar o mock para devolver a resposta esperada
      mockMetricasService.getMetricas.mockResolvedValue(mockMetricasResponse);

      // Executar o método do controlador
      const result = await controller.getMetricas(mockReq);

      // Verificações
      expect(service.getMetricas).toHaveBeenCalledWith(mockUser); // Verifica se o serviço foi chamado com o utilizador correto
      expect(service.getMetricas).toHaveBeenCalledTimes(1); // Verifica se foi chamado apenas uma vez
      expect(result).toEqual(mockMetricasResponse); // Verifica se o retorno é o esperado
    });

    it('deve lançar erro se o serviço falhar', async () => {
      // Simular um erro no serviço
      const error = new Error('Erro no serviço');
      mockMetricasService.getMetricas.mockRejectedValue(error);

      // Verificar se o controlador propaga o erro
      await expect(controller.getMetricas(mockReq)).rejects.toThrow(error);
    });
  });
});