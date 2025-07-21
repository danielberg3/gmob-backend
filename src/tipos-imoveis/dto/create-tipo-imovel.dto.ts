import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTipoImovelDto {
  @IsString({ message: 'O nome do tipo deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome do tipo não pode ser vazio.' })
  nome_tipo: string;
}