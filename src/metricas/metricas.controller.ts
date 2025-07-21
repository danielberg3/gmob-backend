import { Controller, Get, UseGuards, Request} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { MetricasService } from "./metricas.service";

@Controller('metricas')
@UseGuards(JwtAuthGuard)
export class MetricasController {
    constructor(private readonly metricaService: MetricasService) {}

    @Get()
    getMetricas(@Request() req) {
        return this.metricaService.getMetricas(req.user);
    }
}