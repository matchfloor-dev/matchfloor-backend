import { Module } from '@nestjs/common';
import { MailsController } from './mails.controller';
import { envs } from 'src/config/envs.config';

// services
import { MailsService } from './mails.service';
import { MailerModule } from '@nestjs-modules/mailer';


@Module({
    imports: [
        MailerModule.forRoot({
            transport: {
                host: envs.EMAIL_HOST,
                auth: {
                    user: envs.EMAIL_SENDER,
                    pass: envs.EMAIL_PASSWORD
                },
            },
        }),
    ],
    exports: [MailsService],
    controllers: [MailsController],
    providers: [MailsService],
})
export class MailsModule {}
