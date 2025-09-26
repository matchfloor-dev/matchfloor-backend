import {
    IsNotEmpty,
    IsString,
    IsEmail,
    IsArray,
    IsBoolean,
    IsOptional,
} from 'class-validator';

// decorators
import { IsRequired } from 'src/shared/decorators/is-required.decorator';

export class CreateAgentDto {
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    @IsRequired()
    email: string;

    @IsString()
    @IsNotEmpty()
    @IsRequired()
    password: string;

    @IsString()
    @IsNotEmpty()
    @IsRequired()
    passwordConfirmation: string;

    @IsString()
    @IsNotEmpty()
    @IsRequired()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @IsRequired()
    lastName: string;

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
