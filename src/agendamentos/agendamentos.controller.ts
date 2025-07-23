import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AgendamentosService } from './agendamentos.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('agendamentos')
@UseGuards(JwtAuthGuard)
export class AgendamentosController {
  constructor(private readonly service: AgendamentosService) {}

  @Post()
  create(@Body() dto: CreateAgendamentoDto, @Request() req) {
    return this.service.create(dto, req.user);
  }

  // @Get()
  // @Roles('corretor', 'administrador')
  // findAll(@Query() query, @Request() user) {
  //   return this.service.findAll(query, user);
  // }

  // @Get(':id')
  // @Roles('corretor', 'administrador')
  // findOne(@Param('id', ParseIntPipe) id: number, @Request() user) {
  //   return this.service.findOne(id, user);
  // }

  // @Patch(':id')
  // @Roles('corretor', 'administrador')
  // update(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() dto: UpdateAgendamentoDto,
  // ) {
  //   return this.service.update(id, dto);
  // }

  // @Delete(':id')
  // @Roles('corretor', 'administrador')
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.service.remove(id);
  // }
}
