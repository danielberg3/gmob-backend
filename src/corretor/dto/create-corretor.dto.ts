import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, Matches, MinLength } from 'class-validator';
import { Perfil } from '@prisma/client';

export class CreateCorretorDto {
  @IsString({ message: 'Nome completo deve ser uma string' })
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  nome_completo: string;

  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsString({ message: 'Telefone deve ser uma string' })
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @Matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, { 
    message: 'Telefone deve estar no formato (XX) XXXXX-XXXX' 
  })
  telefone: string;

  @IsString({ message: 'CPF deve ser uma string' })
  @IsNotEmpty({ message: 'CPF é obrigatório' })
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { 
    message: 'CPF deve estar no formato XXX.XXX.XXX-XX' 
  })
  cpf: string;

  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha: string;

  @IsEnum(Perfil, { message: 'Perfil deve ser corretor ou administrador' })
  @IsOptional()
  perfil?: Perfil;
}

