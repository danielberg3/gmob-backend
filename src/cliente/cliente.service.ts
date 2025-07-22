import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClienteService {
  constructor(private prismaService: PrismaService) {}

  async create(createClienteDto: CreateClienteDto, currentUser: any) {
    const corretorId = Number(currentUser.corretor_id);

    if (
      currentUser.perfil !== 'corretor' &&
      currentUser.perfil !== 'administrador'
    ) {
      throw new ForbiddenException(
        'Apenas corretores ou admins podem cadastrar clientes',
      );
    }

    const clienteExistentePorEmail = await this.prismaService.cliente.findFirst(
      {
        where: { email: createClienteDto.email },
      },
    );

    if (clienteExistentePorEmail) {
      throw new ForbiddenException('Já existe um cliente com este email');
    }

    const clienteExistentePorCpf = await this.prismaService.cliente.findFirst({
      where: { cpf: createClienteDto.cpf },
    });

    if (clienteExistentePorCpf) {
      throw new ForbiddenException('Já existe um cliente com este CPF');
    }

    return this.prismaService.cliente.create({
      data: {
        corretor_id: corretorId,
        nome: createClienteDto.nome_completo,
        email: createClienteDto.email,
        cpf: createClienteDto.cpf,
        telefone: createClienteDto.telefone,
        tipo_interesse: createClienteDto.tipo_interesse,
      },
    });
  }

  async findAll(user: any, tipoInteresse: string, page: number, limit: number) {
    const where: any = {};

    if (user.perfil === 'corretor') {
      where.corretor_id = Number(user.corretor_id);
    }

    if (tipoInteresse) {
      where.tipo_interesse = tipoInteresse;
    }

    return this.prismaService.cliente.findMany({
      where: {
        corretor_id: where.corretor_id,
        tipo_interesse: where.tipo_interesse,
        arquivado: false,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { data_cadastro: 'desc' },
    });
  }

  async findOne(id: number, user: any) {
    const cliente = await this.prismaService.cliente.findUnique({
      where: { cliente_id: id },
    });

    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    const isOwner = cliente.corretor_id === Number(user.corretor_id);
    const isAdmin = user.perfil === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Acesso negado ao cliente');
    }

    return cliente;
  }

  async update(id: number, updateDto: UpdateClienteDto, user: any) {
    const cliente = await this.prismaService.cliente.findUnique({
      where: { cliente_id: id },
    });

    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    const isOwner = cliente.corretor_id === Number(user.corretor_id);
    const isAdmin = user.perfil === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Você não pode atualizar este cliente');
    }

    if (updateDto.cpf) {
      const existingCpf = await this.prismaService.cliente.findFirst({
        where: {
          cpf: updateDto.cpf,
          cliente_id: { not: id },
        },
      });

      if (existingCpf) {
        throw new ForbiddenException('Já existe um cliente com este CPF');
      }
    }

    const { nome_completo, ...resto } = updateDto;

    return this.prismaService.cliente.update({
      where: { cliente_id: id },
      data: {
        nome: nome_completo,
        ...resto,
      },
    });
  }

  async arquivar(id: number, user: any) {
    const cliente = await this.prismaService.cliente.findUnique({
      where: { cliente_id: id },
    });

    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    const isOwner = cliente.corretor_id === Number(user.corretor_id);
    const isAdmin = user.perfil === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Você não pode arquivar este cliente');
    }

    return this.prismaService.cliente.update({
      where: { cliente_id: id },
      data: { arquivado: true },
    });
  }
}
