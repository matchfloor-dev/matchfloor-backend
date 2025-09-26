import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AgenciesService } from './agencies.service';
import { AgenciesController } from './agencies.controller';

import { envs } from 'src/config/envs.config';

// entities
import { Agency } from './entities/agency.entity';
import { Agent } from '../agents/entities/agent.entity';
import { Prescriptor } from '../prescriptors/entities/prescriptor.entity';

// modules
import { JwtModule } from '@nestjs/jwt';
import { ResidencesModule } from '../residences/residences.module';
import { MailsModule } from '../mails/mails.module';
import { AgencyWorkingDaysModule } from './modules/working-days/working-days.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { StripeModule } from '../payments/modules/stripe/stripe.module';

@Module({
    imports: [
        JwtModule.register({
            secret: envs.JWT_SECRET,
        }),
        ResidencesModule,
        MailsModule,
        AgencyWorkingDaysModule,
        TypeOrmModule.forFeature([Agency, Agent, Prescriptor]),
        SubscriptionsModule,
        StripeModule,
    ],
    controllers: [AgenciesController],
    providers: [AgenciesService],
    exports: [AgenciesService],
})
export class AgenciesModule {}
