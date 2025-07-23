import { IsNotEmpty, IsInt, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAgendamentoDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  imovel_id: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  cliente_id: number;

  @IsNotEmpty()
  @IsDateString()
  data_visita: string;

  @IsNotEmpty()
  @IsString()
  hora_inicio: string;

  @IsNotEmpty()
  @IsString()
  hora_termino: string;

  @IsString()
  observacoes: string;
}
