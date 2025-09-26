import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// modules
import { DatabaseModule } from './database/database.module';
import { InitModule } from './init/init.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { AdminsModule } from './modules/admins/admins.module';
import { AgenciesModule } from './modules/agencies/agencies.module';
import { ClientsModule } from './modules/agencies/modules/clients/clients.module';
import { AgentsModule } from './modules/agents/agents.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuthModule } from './modules/auth/auth.module';
import { CronRemindersModule } from './modules/cronreminders/cronreminders.module';
import { MailsModule } from './modules/mails/mails.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { ResidencesModule } from './modules/residences/residences.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PlansModule } from './modules/plans/plans.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { PrescriptorsModule } from './modules/prescriptors/prescriptors.module';

@Module({
    imports: [
        DatabaseModule,
        AuthModule,
        InitModule,
        AdminsModule,
        AgenciesModule,
        AgentsModule,
        ResidencesModule,
        ClientsModule,
        AppointmentsModule,
        WebhooksModule,
        MailsModule,
        CronRemindersModule,
        RemindersModule,
        ScheduleModule.forRoot(),
        PlansModule,
        SubscriptionsModule,
        PaymentsModule,
        JobsModule,
        PrescriptorsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
