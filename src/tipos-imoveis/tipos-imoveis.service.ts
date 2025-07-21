import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTipoImovelDto } from './dto/create-tipo-imovel.dto';
import { UpdateTipoImovelDto } from './dto/update-tipo-imovel.dto';

@Injectable()
export class TiposImoveisService {
  constructor(private prisma: PrismaService) {}

  async create(createTipoImovelDto: CreateTipoImovelDto) {
    const existing = await this.prisma.tipoImovel.findUnique({
      where: { nome_tipo: createTipoImovelDto.nome_tipo },
    });

    if (existing) {
      throw new ConflictException('Este tipo de imóvel já existe.');
    }

    return this.prisma.tipoImovel.create({
      data: createTipoImovelDto,
    });
  }

  findAll() {
    return this.prisma.tipoImovel.findMany();
  }

  async findOne(id: number) {
    const tipoImovel = await this.prisma.tipoImovel.findUnique({
      where: { tipo_imovel_id: id },
    });
    if (!tipoImovel) {
      throw new NotFoundException(`Tipo de imóvel com ID ${id} não encontrado.`);
    }
    return tipoImovel;
  }

  async update(id: number, updateTipoImovelDto: UpdateTipoImovelDto) {
    await this.findOne(id);
    return this.prisma.tipoImovel.update({
      where: { tipo_imovel_id: id },
      data: updateTipoImovelDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const imoveisVinculados = await this.prisma.imovel.count({
      where: { tipo_imovel_id: id },
    });

    if (imoveisVinculados > 0) {
      throw new ConflictException(
        'Não é possível remover este tipo, pois existem imóveis vinculados a ele.',
      );
    }

    return this.prisma.tipoImovel.delete({
      where: { tipo_imovel_id: id },
    });
  }
}