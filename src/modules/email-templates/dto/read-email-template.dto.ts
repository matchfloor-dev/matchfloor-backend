import { Expose } from 'class-transformer';
import { EmailTemplatesCases } from '../enum/email-templates-cases.enum';

export class ReadEmailTemplateDto {
    @Expose()
    id: number;

    @Expose()
    case: EmailTemplatesCases;
    @Expose()
    subject: string;

    @Expose()
    message: string;

    @Expose()
    html: string;

    @Expose()
    createdAt: Date;
}
