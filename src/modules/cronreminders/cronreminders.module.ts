import { Module } from '@nestjs/common';

// services
import { CronremindersService } from './cronreminders.service';

// modules
import { RemindersModule } from '../reminders/reminders.module';
import { PaymentsModule } from '../payments/payments.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { JobsModule } from '../jobs/jobs.module';
import { AgenciesModule } from '../agencies/agencies.module';
import { MailsModule } from '../mails/mails.module';

@Module({
    imports: [
        RemindersModule,
        PaymentsModule,
        SubscriptionsModule,
        AppointmentsModule,
        JobsModule,
        AgenciesModule,
        MailsModule,
    ],
    providers: [CronremindersService],
    exports: [CronremindersService],
})
export class CronRemindersModule {}
