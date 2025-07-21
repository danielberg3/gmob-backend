import { PartialType } from '@nestjs/mapped-types';
import { CreateImovelDto } from './create-imovel.dto';

export class UpdateImovelDto extends PartialType(CreateImovelDto) {}