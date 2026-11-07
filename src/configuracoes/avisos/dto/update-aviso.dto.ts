import { PartialType } from '@nestjs/mapped-types';
import { CreateAvisoDto } from './create-aviso.dto.js';

export class UpdateAvisoDto extends PartialType(CreateAvisoDto) {}
