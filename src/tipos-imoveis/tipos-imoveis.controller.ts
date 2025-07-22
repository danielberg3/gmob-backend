import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TiposImoveisService } from './tipos-imoveis.service';
import { CreateTipoImovelDto } from './dto/create-tipo-imovel.dto';
import { UpdateTipoImovelDto } from './dto/update-tipo-imovel.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

@Controller('tipos-imoveis')
export class TiposImoveisController {
  constructor(private readonly tiposImoveisService: TiposImoveisService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Perfil.administrador)
  create(@Body() createTipoImovelDto: CreateTipoImovelDto) {
    return this.tiposImoveisService.create(createTipoImovelDto);
  }

  @Get() 
  findAll() {
    return this.tiposImoveisService.findAll();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Perfil.administrador)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTipoImovelDto: UpdateTipoImovelDto,
  ) {
    return this.tiposImoveisService.update(id, updateTipoImovelDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Perfil.administrador)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tiposImoveisService.remove(id);
  }
}