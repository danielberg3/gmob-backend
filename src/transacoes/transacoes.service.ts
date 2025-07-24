import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransacoesDto } from './dto/create-transacoes.dto';
import { ImovelService } from 'src/imovel/imovel.service';
import { ClienteService } from 'src/cliente/cliente.service';
import { UpdateImovelDto } from 'src/imovel/dto/update-imovel.dto';

@Injectable()
export class TransacoesService {
  constructor(
    private prismaService: PrismaService,
    @Inject(forwardRef(() => ImovelService))
    private imovelService: ImovelService,
    private clienteService: ClienteService,
  ) {}

  async create(createTransacoesDto: CreateTransacoesDto, currentUser: any) {
    const cliente = await this.clienteService.findByCpf(
      createTransacoesDto.cpf,
    );

    if (currentUser.corretor_id !== cliente.corretor_id) {
      console.log('currentUser', currentUser);
      console.log('cliente', cliente.cliente_id);
      throw new UnauthorizedException(
        'Você não tem permissão para realizar transações para este cliente.',
      );
    }

    const imovel = await this.imovelService.findOne(
      createTransacoesDto.imovel_id,
      currentUser,
    );
    if (imovel.status !== 'disponivel') {
      throw new BadRequestException(
        'Imóvel não está disponível para transação. ',
      );
    }

    const [_, transacao] = await this.prismaService.$transaction([
      this.prismaService.imovel.update({
        where: { imovel_id: createTransacoesDto.imovel_id },
        data: {
          status:
            createTransacoesDto.tipo_transacao === ('venda' as any)
              ? 'vendido'
              : 'alugado',
        },
      }),
      this.prismaService.transacaoImovel.create({
        data: {
          imovel_id: createTransacoesDto.imovel_id,
          cliente_id: cliente.cliente_id,
          corretor_id: currentUser.corretor_id,
          tipo_transacao: createTransacoesDto.tipo_transacao,
        },
        select: {
          transacao_id: true,
          imovel_id: true,
          cliente_id: true,
          corretor_id: true,
          tipo_transacao: true,
          data_transacao: true,
        },
      }),
    ]);

    return transacao;
  }

  async findAll(currentUser: any, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [transacoes, total] = await Promise.all([
      await this.prismaService.transacaoImovel.findMany({
        skip,
        take: limit,
        where: {
          corretor_id: currentUser.corretor_id,
        },
        select: {
          transacao_id: true,
          imovel_id: true,
          cliente_id: true,
        },
      }),
      this.prismaService.transacaoImovel.count(),
    ]);

    const transacoesComDetalhes = await Promise.all(
      transacoes.map(async (transacao) => ({
        transacao_id: transacao.transacao_id,
        imovel: await this.imovelService.findOne(
          transacao.imovel_id,
          currentUser,
        ),
        cliente: await this.clienteService.findOne(
          transacao.cliente_id,
          currentUser,
        ),
      })),
    );
    return {
      transacoesComDetalhes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async remove(id: number, currentUser: any) {
    const transacao = await this.prismaService.transacaoImovel.findUnique({
      where: { transacao_id: id },
      select: {
        corretor_id: true,
        imovel_id: true,
      },
    });

    if (!transacao) {
      throw new BadRequestException('Transação não encontrada');
    }

    if (transacao.corretor_id !== currentUser.corretor_id) {
      throw new UnauthorizedException(
        'Você não tem permissão para remover esta transação',
      );
    }

    await this.prismaService.transacaoImovel.delete({
      where: { transacao_id: id },
    });

    await this.imovelService.update(
      transacao.imovel_id,
      { status: 'disponivel' } as UpdateImovelDto,
      currentUser,
    );

    return { message: 'Transação removida com sucesso' };
  }

    async removeByImovelId(id: number, currentUser: any) {
    const transacoes = await this.prismaService.transacaoImovel.findMany({
      where: { imovel_id: id },
      select: {
        corretor_id: true,
        transacao_id: true,
      },
    });

    if (transacoes.length === 0) {
      return;
    }

    await this.prismaService.transacaoImovel.deleteMany({
      where: { imovel_id: id },
    });

    return { message: 'Transação removida com sucesso' };
  }
}
