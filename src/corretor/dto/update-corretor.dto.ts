import { PartialType } from '@nestjs/mapped-types';
import { CreateCorretorDto } from './create-corretor.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCorretorDto extends PartialType(CreateCorretorDto) {
  @IsOptional()
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha?: string;
}

