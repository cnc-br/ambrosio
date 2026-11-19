import { PartialType } from '@nestjs/mapped-types';
import { CreateSetorDto } from './create-setor.dto.js';

export class UpdateSetorDto extends PartialType(CreateSetorDto) {}
