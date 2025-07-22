import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Param,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Post()
  create(@Body() createClienteDto: CreateClienteDto, @Request() req) {
    return this.clienteService.create(createClienteDto, req.user);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('tipoInteresse') tipoInteresse: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.clienteService.findAll(
      req.user,
      tipoInteresse,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.clienteService.findOne(Number(id), req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClienteDto,
    @Request() req,
  ) {
    return this.clienteService.update(Number(id), dto, req.user);
  }

  @Patch(':id/arquivar')
  arquivar(@Param('id') id: string, @Request() req) {
    return this.clienteService.arquivar(Number(id), req.user);
  }
}
