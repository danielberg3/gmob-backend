import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoImovelDto } from './create-tipo-imovel.dto';

export class UpdateTipoImovelDto extends PartialType(CreateTipoImovelDto) {}