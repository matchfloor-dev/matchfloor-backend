import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsArray,
    IsBoolean,
} from 'class-validator';

export class UpdateAgentDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    email?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    lastName?: string;

    @IsArray()
    @IsOptional()
    residencesIds?: number[];

    @IsBoolean()
    @IsOptional()
    allResidences?: boolean;

    @IsBoolean()
    @IsOptional()
    isOwner?: boolean;
}
