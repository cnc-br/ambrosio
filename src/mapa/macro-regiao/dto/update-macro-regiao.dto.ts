import { PartialType } from '@nestjs/mapped-types';
import { CreateMacroRegiaoDto } from './create-macro-regiao.dto.js';

export class UpdateMacroRegiaoDto extends PartialType(CreateMacroRegiaoDto) {}
