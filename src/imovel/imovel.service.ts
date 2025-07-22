import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImovelDto } from './dto/create-imovel.dto';
import { UpdateImovelDto } from './dto/update-imovel.dto';
import { Imovel, Perfil } from '@prisma/client';

@Injectable()
export class ImovelService {
  constructor(private prisma: PrismaService) {}

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
      limit = 10,
      tipo,
      estado,
      cidade,
      valorMin,
      valorMax,
      status,
    } = queryParams;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (user && user.perfil === Perfil.corretor) {
      where.corretor_id = user.corretor_id; 
    }

    // ... restante da lógica de filtros ...
    if (tipo) where.tipo_imovel_id = Number(tipo);
    if (status) where.status = status;
    if (estado) where.estado = { contains: estado, mode: 'insensitive' };
    if (cidade) where.cidade = { contains: cidade, mode: 'insensitive' };
    if (valorMin || valorMax) {
      where.valor = {};
      if (valorMin) where.valor.gte = Number(valorMin);
      if (valorMax) where.valor.lte = Number(valorMax);
    }

    const [imoveis, total] = await this.prisma.$transaction([
      this.prisma.imovel.findMany({
        where,
        skip,
        take: Number(limit),
        include: { corretor: { select: { nome_completo: true } } },
      }),
      this.prisma.imovel.count({ where }),
    ]);

    return {
      data: imoveis,
      total,
      page: Number(page),
      lastPage: Math.ceil(total / Number(limit)),
    };
  }

  async findOne(id: number, user: any): Promise<Imovel> {
    const imovel = await this.prisma.imovel.findUnique({
      where: { imovel_id: id },
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

    return imovel;
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

    return this.prisma.imovel.delete({ where: { imovel_id: id } });
  }
}