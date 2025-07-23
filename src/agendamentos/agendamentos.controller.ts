import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
} from '@nestjs/common';
import { AgendamentosService } from './agendamentos.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { StatusAgendamento } from '@prisma/client';
import { UpdateAgendamentoDto } from './dto/update-agendamento.dto';

@Controller('agendamentos')
@UseGuards(JwtAuthGuard)
export class AgendamentosController {
  constructor(private readonly service: AgendamentosService) {}

  @Post()
  @Roles('corretor', 'administrador')
  create(@Body() dto: CreateAgendamentoDto, @Request() req) {
    return this.service.create(dto, req.user);
  }

  @Get()
  @Roles('corretor', 'administrador')
  findAll(
    @Request() req: { user: any },
    @Query('imovelId') imovelId: string,
    @Query('clienteId') clienteId: string,
    @Query('data') data: string,
    @Query('status') status: StatusAgendamento,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.service.findAll(
      req.user,
      imovelId ? Number(imovelId) : undefined,
      clienteId ? Number(clienteId) : undefined,
      data,
      status,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  @Roles('corretor', 'administrador')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    console.log(`Buscando agendamento com ID: ${id}`);
    return this.service.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles('corretor', 'administrador')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAgendamentoDto,
    @Request() req,
  ) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles('corretor', 'administrador')
  cancel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.service.cancel(id, req.user);
  }
}
