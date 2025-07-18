import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, ParseIntPipe } from '@nestjs/common';
import { CorretorService } from './corretor.service';
import { CreateCorretorDto } from './dto/create-corretor.dto';
import { UpdateCorretorDto } from './dto/update-corretor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('corretor')
@UseGuards(JwtAuthGuard)
export class CorretorController {
  constructor(private readonly corretorService: CorretorService) {}

  @Post()
  create(@Body() createCorretorDto: CreateCorretorDto, @Request() req) {
    return this.corretorService.create(createCorretorDto, req.user);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.corretorService.findAll(req.user, page, limit);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.corretorService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCorretorDto: UpdateCorretorDto,
    @Request() req,
  ) {
    return this.corretorService.update(id, updateCorretorDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.corretorService.remove(id, req.user);
  }
}

