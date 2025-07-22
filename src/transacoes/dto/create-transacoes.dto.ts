import {TipoTransacao } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString, Matches } from "class-validator";

export class CreateTransacoesDto{
    @IsNotEmpty({ message: 'O ID do imóvel é obrigatório.' })
    imovel_id: number;

    @IsString({ message: 'CPF deve ser uma string' })
    @IsNotEmpty({ message: 'CPF é obrigatório' })
    @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { 
        message: 'CPF deve estar no formato XXX.XXX.XXX-XX' 
    })
    cpf: string;
    
    @IsNotEmpty({ message: 'O tipo de transação é obrigatório.' })
    @IsEnum(TipoTransacao, { message: 'Tipo de transação deve ser compra ou aluguel' })
    tipo_transacao: TipoTransacao;
}