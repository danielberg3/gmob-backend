import {
  IsInt,
  IsOptional,
  IsDateString,
  IsString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

enum StatusAgendamento {
  AGENDADO = 'agendado',
  CONFIRMADO = 'confirmado',
  CANCELADO = 'cancelado',
  REALIZADO = 'realizado',
}

export class UpdateAgendamentoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  imovel_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cliente_id?: number;

  @IsOptional()
  @IsDateString()
  data_visita?: string;

  @IsOptional()
  @IsString()
  hora_inicio?: string;

  @IsOptional()
  @IsString()
  hora_termino?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsEnum(StatusAgendamento, {
    message: 'status_agendamento deve ser um valor válido',
  })
  status_agendamento?: StatusAgendamento;
}
