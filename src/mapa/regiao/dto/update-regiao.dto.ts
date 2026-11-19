import { PartialType } from '@nestjs/mapped-types';
import { CreateRegiaoDto } from './create-regiao.dto.js';

export class UpdateRegiaoDto extends PartialType(CreateRegiaoDto) {}
