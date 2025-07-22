import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import { CreateTransacoesDto } from "./dto/create-transacoes.dto";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransacoesService } from "./transacoes.service";

@Controller('transacoes')
@UseGuards(JwtAuthGuard)
export class TransacoesController {
    constructor(private readonly transacoesService: TransacoesService) {}

    @Post()
    create(@Body() createTransacoesDto: CreateTransacoesDto, @Request() req) {
        return this.transacoesService.create(createTransacoesDto, req.user);
    }
}