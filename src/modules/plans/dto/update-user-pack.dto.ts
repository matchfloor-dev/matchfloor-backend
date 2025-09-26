import { PartialType } from '@nestjs/mapped-types';
import { CreateUserPackDto } from './create-user-pack.dto';

export class UpdateUserPackDto extends PartialType(CreateUserPackDto) {} 