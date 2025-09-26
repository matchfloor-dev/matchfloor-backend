import {
    IsNotEmpty,
    IsString,
    IsArray,
    IsBoolean,
    IsOptional,
} from 'class-validator';

// decorators
import { IsRequired } from 'src/shared/decorators/is-required.decorator';

export class CreateResidenceDto {
    @IsString()
    @IsNotEmpty()
    @IsRequired()
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsRequired()
    ownerEmail: string;

    @IsArray()
    @IsOptional()
    agentsIds: number[];

    @IsBoolean()
    @IsRequired()
    allAgents: boolean;

    @IsString()
    @IsArray()
    @IsOptional()
    identifiers?: string[];
}
