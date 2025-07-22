import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Request, UseGuards } from "@nestjs/common";
import { CreateTransacoesDto } from "./dto/create-transacoes.dto";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransacoesService } from "./transacoes.service";
import { get } from "http";

@Controller('transacoes')
@UseGuards(JwtAuthGuard)
export class TransacoesController {
    constructor(private readonly transacoesService: TransacoesService) {}

    @Post()
    create(@Body() createTransacoesDto: CreateTransacoesDto, @Request() req) {
        return this.transacoesService.create(createTransacoesDto, req.user);
    }

    @Get()
    findAll(@Request() req) {
        return this.transacoesService.findAll(req.user);
    }   

    @Delete(':id')
      remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.transacoesService.remove(id, req.user);
      }
}