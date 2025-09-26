import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Entities
import { Prescriptor } from './entities/prescriptor.entity';

// Controllers
import { PrescriptorsController } from './prescriptors.controller';

// Services
import { PrescriptorsService } from './prescriptors.service';
import { MailsModule } from '../mails/mails.module';
import { envs } from 'src/config/envs.config';

@Module({
    imports: [
        TypeOrmModule.forFeature([Prescriptor]),
        MailsModule,
        JwtModule.register({
            secret: envs.JWT_SECRET,
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [PrescriptorsController],
    providers: [PrescriptorsService],
    exports: [PrescriptorsService],
})
export class PrescriptorsModule {} 