import { IsEnum, IsOptional, IsString } from 'class-validator';

import { EmailTemplatesCases } from '../enum/email-templates-cases.enum';

export class CreateEmailTemplateDto {
    @IsString()
    @IsEnum(EmailTemplatesCases)
    case: string;

    @IsString()
    subject: string;

    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    @IsString()
    html?: string;
}
