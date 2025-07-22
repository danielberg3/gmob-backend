import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  Matches,
} from 'class-validator';

enum TIPO_INTERESSE {
  COMPRA = 'compra',
  ALUGUEL = 'aluguel',
}

export class CreateClienteDto {
  @IsString({ message: 'Nome completo deve ser uma string' })
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  nome_completo: string;

  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsString({ message: 'Telefone deve ser uma string' })
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @Matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, {
    message: 'Telefone deve estar no formato (XX) XXXXX-XXXX',
  })
  telefone: string;

  @IsString({ message: 'CPF deve ser uma string' })
  @IsNotEmpty({ message: 'CPF é obrigatório' })
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'CPF deve estar no formato XXX.XXX.XXX-XX',
  })
  cpf: string;

  @IsEnum(TIPO_INTERESSE, {
    message: 'Tipo de interesse deve ser "compra" ou "aluguel"',
  })
  @IsNotEmpty({ message: 'Tipo de interesse é obrigatório' })
  tipo_interesse: TIPO_INTERESSE;
}
