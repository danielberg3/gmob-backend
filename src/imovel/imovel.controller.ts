import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, ParseIntPipe, Optional, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ImovelService } from './imovel.service';
import { CreateImovelDto } from './dto/create-imovel.dto';
import { UpdateImovelDto } from './dto/update-imovel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';


@Controller('imoveis')
export class ImovelController {
  constructor(private readonly imovelService: ImovelService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Perfil.corretor, Perfil.administrador)
  create(@Body() createImovelDto: CreateImovelDto,  @Req() req) {
    return this.imovelService.create(createImovelDto, req.user);
  }

  @Post(':id/imagens')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Perfil.corretor, Perfil.administrador)
  @UseInterceptors(FilesInterceptor('files', 10)) 
  async uploadImagens(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req,
  ) {
    return this.imovelService.uploadImagens(id, files, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard) 
  @Optional() 
  findAll(@Req() req, @Query() queryParams: any) {
    return this.imovelService.findAll(req.user, queryParams);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Optional()
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.imovelService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Perfil.corretor, Perfil.administrador) 
  update(@Param('id', ParseIntPipe) id: number, @Body() updateImovelDto: UpdateImovelDto, @Req() req) {
    return this.imovelService.update(id, updateImovelDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Perfil.corretor, Perfil.administrador) 
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.imovelService.remove(id, req.user);
  }
}