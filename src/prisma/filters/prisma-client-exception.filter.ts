import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocorreu um erro inesperado no servidor.';
    let error = 'Internal Server Error';

    switch (exception.code) {
      
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        const fieldName = exception.meta?.field_name as string;
        message = `A operação falhou porque o valor fornecido para '${fieldName}' não existe em um registro relacionado.`;
        error = 'Bad Request';
        break;

      
      case 'P2002':
        status = HttpStatus.CONFLICT;
        const target = exception.meta?.target as string[];
        message = `Já existe um registro com este valor. O campo '${target.join(
          ', ',
        )}' deve ser único.`;
        error = 'Conflict';
        break;

    
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message =
          'A operação falhou porque o registro que você tentou modificar ou deletar não foi encontrado.';
        error = 'Not Found';
        break;

     
      default:
        message = `Erro no banco de dados não tratado (Código Prisma: ${exception.code})`;
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
    });
  }
}