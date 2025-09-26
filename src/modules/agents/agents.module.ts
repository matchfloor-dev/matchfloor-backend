import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';

// entities
import { Agent } from './entities/agent.entity';
import { Residence } from '../residences/entities/residence.entity';
import { Client } from '../agencies/modules/clients/entities/client.entity';

// modules
import { JwtModule } from '@nestjs/jwt';
import { AppointmentsModule } from '../appointments/appointments.module';
import { MailsModule } from '../mails/mails.module';
import { AgentWorkingDaysModule } from './modules/working-days/working-days.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ResidencesModule } from '../residences/residences.module';

// config
import { envs } from 'src/config/envs.config';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
    imports: [
        JwtModule.register({
            secret: envs.JWT_SECRET,
        }),
        TypeOrmModule.forFeature([Agent, Residence, Client]),
        forwardRef(() => AppointmentsModule),
        forwardRef(() => AgentWorkingDaysModule),
        MailsModule,
        SubscriptionsModule,
        forwardRef(() => RemindersModule),
        ResidencesModule,
    ],
    controllers: [AgentsController],
    providers: [AgentsService],
    exports: [AgentsService],
})
export class AgentsModule {}
