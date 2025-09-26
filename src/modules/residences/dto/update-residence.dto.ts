import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsArray,
    IsBoolean,
} from 'class-validator';

export class UpdateResidenceDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    ownerEmail?: string;

    @IsArray()
    @IsOptional()
    agentsIds?: number[];

    @IsBoolean()
    @IsOptional()
    allAgents?: boolean;
}
