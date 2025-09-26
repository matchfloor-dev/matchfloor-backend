import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs } from 'src/config/envs.config';

// Controllers
import { AppointmentsController } from './appointments.controller';

// Entities
import { Client } from 'src/modules/agencies/modules/clients/entities/client.entity';
import { Residence } from 'src/modules/residences/entities/residence.entity';
import { Appointment } from './entities/appointment.entity';
import { AppointmentStatusHistory } from './entities/appointmentStatusHistory.entity';

// Services
import { AppointmentsService } from './appointments.service';
import { NotificationsService } from './notifications.service';
import { AvailabilityService } from './availability.service';
import { ClientsService } from 'src/modules/agencies/modules/clients/clients.service';

// Modules
import { AgenciesModule } from '../agencies/agencies.module';
import { ClientsModule } from '../agencies/modules/clients/clients.module';
import { AgentsModule } from '../agents/agents.module';
import { AssignedResidencesModule } from '../agents/modules/assigned-residences/assigned-residences.module';
import { AgentWorkingDaysModule } from '../agents/modules/working-days/working-days.module';
import { MailsModule } from '../mails/mails.module';
import { RemindersModule } from '../reminders/reminders.module';
import { ResidencesModule } from '../residences/residences.module';
import { ConfigurationModule } from '../agencies/modules/configuration/configuration.module';
import { AppointmentStatusHistoryService } from './appointmentStatusHistory.service';
import { NotificationsModule } from '../agencies/modules/notifications/notifications.module';

@Module({
    imports: [
        JwtModule.register({
            secret: envs.JWT_SECRET,
        }),
        TypeOrmModule.forFeature([
            Appointment,
            Residence,
            Client,
            AppointmentStatusHistory,
        ]),
        forwardRef(() => AssignedResidencesModule),
        forwardRef(() => AgentWorkingDaysModule),
        ResidencesModule,
        MailsModule,
        forwardRef(() => AgentsModule),
        ClientsModule,
        AgenciesModule,
        RemindersModule,
        ConfigurationModule,
        NotificationsModule,
    ],
    controllers: [AppointmentsController],
    providers: [
        AppointmentsService,
        NotificationsService,
        AvailabilityService,
        ClientsService,
        AppointmentStatusHistoryService,
    ],
    exports: [
        AppointmentsService,
        NotificationsService,
        AvailabilityService,
        AppointmentStatusHistoryService,
    ],
})
export class AppointmentsModule {}
