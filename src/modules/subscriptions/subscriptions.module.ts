import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';

// entities
import { Subscription } from './entities/subscriptions.entity';
import { SubscriptionPayment } from '../payments/entities/subscription-payment.entity';
import { UserPack } from '../plans/entities/user-pack.entity';

// modules
import { AgenciesModule } from '../agencies/agencies.module';
import { PlansModule } from '../plans/plans.module';
import { StripeModule } from '../payments/modules/stripe/stripe.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Subscription, SubscriptionPayment, UserPack]),
        forwardRef(() => AgenciesModule),
        forwardRef(() => PlansModule),
        forwardRef(() => StripeModule),
    ],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
