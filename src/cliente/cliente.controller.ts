import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './dto/create-cliente.dto';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Post()
  create(@Body() createClienteDto: CreateClienteDto, @Request() req) {
    return this.clienteService.create(createClienteDto, req.user);
  }

  //   @Get()
  //   findAll(
  //     @Request() req,
  //     @Query('page', ParseIntPipe) page: number = 1,
  //     @Query('limit', ParseIntPipe) limit: number = 10,
  //   ) {
  //     return this.corretorService.findAll(req.user, page, limit);
  //   }

  //   @Get(':id')
  //   findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
  //     return this.corretorService.findOne(id, req.user);
  //   }

  //   @Patch(':id')
  //   update(
  //     @Param('id', ParseIntPipe) id: number,
  //     @Body() updateCorretorDto: UpdateCorretorDto,
  //     @Request() req,
  //   ) {
  //     return this.corretorService.update(id, updateCorretorDto, req.user);
  //   }

  //   @Delete(':id')
  //   remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
  //     return this.corretorService.remove(id, req.user);
  //   }
}
