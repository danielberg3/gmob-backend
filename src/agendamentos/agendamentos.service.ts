import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AgendamentoVisita } from '@prisma/client';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { Corretor } from '@prisma/client';

@Injectable()
export class AgendamentosService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: CreateAgendamentoDto,
    currentUser: Corretor,
  ): Promise<AgendamentoVisita> {
    const {
      cliente_id,
      imovel_id,
      data_visita,
      hora_inicio,
      hora_termino,
      observacoes,
    } = data;

    const corretorId = Number(currentUser.corretor_id);
    
    if (currentUser.perfil !== 'corretor') {
      throw new ForbiddenException(
        'Apenas corretores podem cadastrar agendamentos',
      );
    }

    const dataHoraInicio = new Date(`${data_visita}T${hora_inicio}:00`);
    const dataHoraTermino = new Date(`${data_visita}T${hora_termino}:00`);

    if (dataHoraInicio <= new Date()) {
      throw new ForbiddenException('A data da visita deve ser futura');
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
  }
}
