import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { StatusImovel, TipoImovel } from '@prisma/client';

export class CreateImovelDto {
  
  @IsNotEmpty({ message: 'O tipo do imóvel é obrigatório.' })
  tipo_imovel_id: number; 

  @IsEnum(StatusImovel)
  @IsNotEmpty({ message: 'O status do imóvel é obrigatório.' })
  status: StatusImovel;

  @IsString() @IsNotEmpty() 
  estado: string;

  @IsString() @IsNotEmpty() 
  cidade: string;
  
  @IsString() @IsNotEmpty() 
  rua: string;
  
  @IsString() @IsNotEmpty() 
  numero: string;

  @IsString() @IsOptional() 
  complemento?: string;

  @IsNumber() @IsNotEmpty() 
  valor: number;

  @IsNumber() @IsNotEmpty() 
  area: number;

  @IsNumber() @IsNotEmpty() 
  numero_comodos: number;
  
  @IsString() @IsOptional() 
  descricao?: string;
}