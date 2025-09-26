import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAgentProfileDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    password?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    confirmPassword?: string;
}
