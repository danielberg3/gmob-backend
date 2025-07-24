import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AgendamentoVisita, Perfil } from '@prisma/client';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { StatusAgendamento } from '@prisma/client';
import { UpdateAgendamentoDto } from './dto/update-agendamento.dto';

type currentUser = {
  perfil: string;
  corretor_id?: number;
};

@Injectable()
export class AgendamentosService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: CreateAgendamentoDto,
    currentUser: currentUser,
  ): Promise<AgendamentoVisita> {
    try {
      const {
        cliente_id,
        imovel_id,
        data_visita,
        hora_inicio,
        hora_termino,
        observacoes,
      } = data;

      const corretorId = Number(currentUser.corretor_id);

      if (currentUser.perfil !== 'corretor' && currentUser.perfil !== 'administrador') {
        throw new ForbiddenException(
          'Apenas corretores podem cadastrar agendamentos',
        );
      }

      const dataHoraInicio = new Date(`${data_visita}T${hora_inicio}:00`);
      const dataHoraTermino = new Date(`${data_visita}T${hora_termino}:00`);

      if (dataHoraInicio <= new Date()) {
        throw new ForbiddenException('A data da visita deve ser futura');
      }

      if (dataHoraTermino <= dataHoraInicio) {
        throw new ForbiddenException(
          'O horário de término deve ser maior que o horário de início',
        );
      }

      const conflito = await this.prisma.agendamentoVisita.findFirst({
        where: {
          cliente_id,
          imovel_id,
          data_visita: new Date(data_visita),
          hora_inicio: dataHoraInicio,
        },
      });

      if (conflito) {
        throw new ForbiddenException(
          'Já existe um agendamento para esse cliente/imóvel/data/hora',
        );
      }

      const agendamento = await this.prisma.agendamentoVisita.create({
        data: {
          corretor_id: corretorId,
          imovel_id,
          cliente_id,
          data_visita: new Date(data_visita),
          hora_inicio: dataHoraInicio,
          hora_termino: dataHoraTermino,
          observacoes,
        },
      });

      return agendamento;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ForbiddenException('Erro ao criar agendamento');
    }
  }

  async findAll(
    user: currentUser,
    imovelId?: number,
    clienteId?: number,
    data?: string,
    status?: StatusAgendamento,
    page = 1,
    limit = 10,
  ) {
    try {
      if (user.perfil !== 'corretor' && user.perfil !== 'administrador') {
        throw new ForbiddenException(
          'Apenas corretores e administradores podem listar agendamentos',
        );
      }

      const take = Number(limit);
      const skip = (Number(page) - 1) * take;

      const where: {
        imovel_id?: number;
        cliente_id?: number;
        data_visita?: string;
        status_agendamento?: StatusAgendamento;
        corretor_id?: number;
      } = {};

      if (user.perfil === 'corretor') {
        where.corretor_id = user.corretor_id;
      }

      if (imovelId) where.imovel_id = imovelId;
      if (clienteId) where.cliente_id = clienteId;
      if (data) where.data_visita = data;

      if (status && Object.values(StatusAgendamento).includes(status)) {
        where.status_agendamento = status;
      }

      const [result, total] = await Promise.all([
        this.prisma.agendamentoVisita.findMany({
          where,
          skip,
          take,
          orderBy: { data_visita: 'asc' },
        }),
        this.prisma.agendamentoVisita.count({ where }),
      ]);

      return {
        data: result,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take),
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new Error('Erro ao buscar agendamentos');
    }
  }

  async findOne(id: number, user: currentUser): Promise<AgendamentoVisita> {
    console.log(
      `Buscando agendamento com ID: ${id} para o usuário: ${user.perfil}`,
    );
    try {
      if (user.perfil !== 'corretor' && user.perfil !== 'administrador') {
        throw new ForbiddenException(
          'Apenas corretores e administradores podem visualizar agendamentos',
        );
      }
      const where: {
        agendamento_id: number;
        corretor_id?: number;
      } = { agendamento_id: id };

      if (user.perfil === 'corretor') {
        where.corretor_id = user.corretor_id;
      }

      const agendamento = await this.prisma.agendamentoVisita.findUnique({
        where: where,
      });

      if (!agendamento) {
        throw new ForbiddenException('Agendamento não encontrado');
      }

      return agendamento;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new Error('Erro ao buscar agendamento');
    }
  }

  async update(
    id: number,
    dto: UpdateAgendamentoDto,
    user: currentUser,
  ): Promise<AgendamentoVisita> {
    if (!Object.values(Perfil).includes(user.perfil as Perfil)) {
      throw new ForbiddenException('Acesso negado');
    }

    const agendamento = await this.prisma.agendamentoVisita.findFirst({
      where: {
        agendamento_id: id,
        ...(user.perfil === Perfil.corretor && {
          corretor_id: user.corretor_id,
        }),
      },
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const existeOutro = await this.prisma.agendamentoVisita.findFirst({
      where: {
        imovel_id: dto.imovel_id ?? agendamento.imovel_id,
        data_visita: dto.data_visita
          ? new Date(dto.data_visita)
          : agendamento.data_visita,
        NOT: { agendamento_id: id },
      },
    });

    if (existeOutro) {
      throw new ConflictException(
        "Já existe um registro com este valor. O campo 'cliente_id, imovel_id, data_visita, hora_inicio' deve ser único.",
      );
    }

    const atualizado = await this.prisma.agendamentoVisita.update({
      where: { agendamento_id: id },
      data: {
        ...(dto.imovel_id !== undefined && { imovel_id: dto.imovel_id }),
        ...(dto.cliente_id !== undefined && { cliente_id: dto.cliente_id }),
        ...(dto.data_visita && {
          data_visita: new Date(dto.data_visita),
        }),
        ...(dto.hora_inicio && { hora_inicio: dto.hora_inicio }),
        ...(dto.hora_termino && { hora_termino: dto.hora_termino }),
        ...(dto.observacoes && { observacoes: dto.observacoes }),
        ...(dto.status_agendamento && {
          status_agendamento: dto.status_agendamento,
        }),
      },
    });

    return atualizado;
  }

  async cancel(id: number, user: currentUser): Promise<AgendamentoVisita> {
    try {
      if (user.perfil !== 'corretor' && user.perfil !== 'administrador') {
        throw new ForbiddenException('Acesso negado');
      }

      const agendamento = await this.prisma.agendamentoVisita.findUnique({
        where: { agendamento_id: id },
      });

      if (!agendamento) {
        throw new ForbiddenException('Agendamento não encontrado');
      }

      const cancelado = await this.prisma.agendamentoVisita.update({
        where: { agendamento_id: id },
        data: {
          status_agendamento: 'cancelado',
        },
      });

      return cancelado;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new Error('Erro ao cancelar agendamento');
    }
  }

  async remove(id: number, user: currentUser): Promise<AgendamentoVisita> {
    try {
      if (user.perfil !== 'corretor' && user.perfil !== 'administrador') {
        throw new ForbiddenException('Acesso negado');
      }

      const agendamento = await this.prisma.agendamentoVisita.findUnique({
        where: { agendamento_id: id },
      });

      if (!agendamento) {
        throw new NotFoundException('Agendamento não encontrado');
      }

      const removido = await this.prisma.agendamentoVisita.delete({
        where: { agendamento_id: id },
      });

      return removido;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new Error('Erro ao remover agendamento');
    }
  }
  async removeByImovelId(imovelId: number, user: currentUser): Promise<void> {
    if (user.perfil !== 'corretor' && user.perfil !== 'administrador') {
      throw new ForbiddenException('Acesso negado');
    }

    const agendamentos = await this.prisma.agendamentoVisita.findMany({
      where: { imovel_id: imovelId },
    });

    if (agendamentos.length === 0) {
      return;
    }

    await this.prisma.agendamentoVisita.deleteMany({
      where: { imovel_id: imovelId },
    });
  }
}
