import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';

@Injectable()
export class ClienteService {
  constructor(private prismaService: PrismaService) {}

  async create(createClienteDto: CreateClienteDto, currentUser: any) {

    const corretorId = Number(currentUser.corretor_id);

    if (currentUser.perfil !== 'corretor' && currentUser.perfil !== 'admin') {
      throw new ForbiddenException(
        'Apenas corretores ou admins podem cadastrar clientes',
      );
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
}
