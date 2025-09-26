import { Type } from 'class-transformer';
import { ReadPlansDto } from './read-plans.dto';
import { ReadUserPackDto } from './read-user-pack.dto';

export class DefaultPlanResponseDto {
    @Type(() => ReadPlansDto)
    plan: ReadPlansDto;

    @Type(() => ReadUserPackDto)
    userPacks: ReadUserPackDto[];
} 