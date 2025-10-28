import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  forwardRef,
  Inject,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImovelDto } from './dto/create-imovel.dto';
import { UpdateImovelDto } from './dto/update-imovel.dto';
import { Imovel, Perfil, Disponibilidade } from '@prisma/client';
import { TransacoesService } from 'src/transacoes/transacoes.service';
import { AgendamentosService } from 'src/agendamentos/agendamentos.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ImovelService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => TransacoesService))
    private transacaoService: TransacoesService,
    private agendamentoService: AgendamentosService,
  ) {}

  async create(createImovelDto: CreateImovelDto, user: any): Promise<Imovel> {
    const { rua, numero, complemento, cidade, estado } = createImovelDto;
    const existingAddress = await this.prisma.imovel.findFirst({
      where: { rua, numero, complemento, cidade, estado },
    });

    if (existingAddress) {
      throw new ConflictException(
        'Um imóvel com este endereço já foi cadastrado.',
      );
    }

    return this.prisma.imovel.create({
      data: {
        ...createImovelDto,
        corretor_id: user.corretor_id,
        status: 'disponivel',
      },
    });
  }

  async findAll(user: any, queryParams: any) {
    const {
      page = 1,
      limit = 5,
      tipo,
      estado,
      cidade,
      valorMin,
      valorMax,
      status,
      disponibilidade,
      valorAluguelMin,
      valorAluguelMax,
    } = queryParams;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (user && user.perfil === Perfil.corretor) {
      where.corretor_id = user.corretor_id;
    }

    if (tipo) where.tipo_imovel_id = Number(tipo);
    if (status) where.status = status;
    if (estado) where.estado = { contains: estado, mode: 'insensitive' };
    if (cidade) where.cidade = { contains: cidade, mode: 'insensitive' };

    if (valorMin || valorMax) {
      where.valor = {};
      if (valorMin) where.valor.gte = Number(valorMin);
      if (valorMax) where.valor.lte = Number(valorMax);
    }

    if (disponibilidade) {
      where.disponibilidade = disponibilidade as Disponibilidade;
    }

    if (valorAluguelMin || valorAluguelMax) {
      where.valor_aluguel = {};
      if (valorAluguelMin) where.valor_aluguel.gte = Number(valorAluguelMin);
      if (valorAluguelMax) where.valor_aluguel.lte = Number(valorAluguelMax);
    }

    const [imoveis, total] = await this.prisma.$transaction([
      this.prisma.imovel.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          corretor: { select: { nome_completo: true } },
          imagens: true,
        },
      }),
      this.prisma.imovel.count({ where }),
    ]);

    const imoveisFormatados = imoveis.map(({ imagens, ...resto }) => ({
      ...resto,
      imagens,
    }));

    return {
      data: imoveisFormatados,
      total,
      page: Number(page),
      lastPage: Math.ceil(total / Number(limit)),
    };
  }

  async findOne(id: number, user: any): Promise<any> {
    const imovel = await this.prisma.imovel.findUnique({
      where: { imovel_id: id },
      include: {
        imagens: true,
      },
    });

    if (!imovel) {
      throw new NotFoundException(`Imóvel com ID ${id} não encontrado.`);
    }

    if (!user) {
      throw new ForbiddenException('Acesso negado. Autenticação necessária.');
    }

    if (
      user.perfil !== Perfil.administrador &&
      imovel.corretor_id !== user.corretor_id
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.',
      );
    }

    const { imagens, ...restoDoImovel } = imovel;
    return { ...restoDoImovel, imagens };
  }

  async update(
    id: number,
    updateImovelDto: UpdateImovelDto,
    user: any,
  ): Promise<Imovel> {
    await this.findOne(id, user);

    return this.prisma.imovel.update({
      where: { imovel_id: id },
      data: updateImovelDto,
    });
  }

  async remove(id: number, user: any): Promise<Imovel> {
    await this.findOne(id, user);

    const transacoes = await this.prisma.transacaoImovel.findFirst({
      where: { imovel_id: id },
    });

    if (transacoes) {
      throw new ConflictException(
        'Este imóvel não pode ser excluído pois possui um histórico de vendas ou aluguéis.',
      );
    }

    await this.agendamentoService.removeByImovelId(id, user);

    await this.prisma.imagemImovel.deleteMany({
      where: { imovel_id: id },
    });

    return this.prisma.imovel.delete({ where: { imovel_id: id } });
  }

  async uploadImagens(
    id: number,
    files: Array<Express.Multer.File>,
    user: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    await this.findOne(id, user);

    const urlsSalvas = files.map((file) => {
      const urlSimulada = `uploads/imoveis/${id}/${Date.now()}-${file.originalname}`;
      return urlSimulada;
    });

    const dadosImagens = urlsSalvas.map((url) => {
      return {
        url: url,
        imovel_id: id,
      };
    });

    await this.prisma.imagemImovel.createMany({
      data: dadosImagens,
    });

    return { message: `${files.length} imagens salvas com sucesso.` };
  }
}