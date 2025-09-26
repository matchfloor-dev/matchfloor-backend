import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
// import { defaultEmails } from '../email-templates/html-templates/default-emails';
import { MailsService } from './mails.service';
import { ContactFormDto } from './dto/contact-form.dto';
import { GenericResponse } from 'src/shared/genericResponse.dto';

// Decorators
import { Public } from 'src/modules/auth/decorators/public.decorator';

@Controller('mails')
export class MailsController {
    constructor(private readonly mailsService: MailsService) {}

    @Public()
    @Post('contact')
    @HttpCode(HttpStatus.OK)
    async sendContactForm(
        @Body() contactFormDto: ContactFormDto
    ): Promise<GenericResponse<boolean>> {
        await this.mailsService.sendContactFormEmail(contactFormDto);
        return new GenericResponse<boolean>(true);
    }
}
