import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateEmailTemplateDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    case?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    subject?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    message?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    html?: string;
}
