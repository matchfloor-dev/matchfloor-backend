import { forwardRef, Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

// typeorm
import { TypeOrmModule } from '@nestjs/typeorm';

// modules
import { StripeModule } from './modules/stripe/stripe.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MailsModule } from '../mails/mails.module';
import { NotificationsModule } from '../agencies/modules/notifications/notifications.module';

// entities
import { SubscriptionPayment } from './entities/subscription-payment.entity';
import { AgenciesModule } from '../agencies/agencies.module';
// import { AgenciesModule } from '../agencies/agencies.module';

@Module({
    controllers: [PaymentsController],
    providers: [PaymentsService],
    imports: [
        MailsModule,
        StripeModule,
        forwardRef(() => SubscriptionsModule),
        NotificationsModule,
        TypeOrmModule.forFeature([SubscriptionPayment]),
        forwardRef(() => AgenciesModule),
    ],
    exports: [PaymentsService],
})
export class PaymentsModule {}
