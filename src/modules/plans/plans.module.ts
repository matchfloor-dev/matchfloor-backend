import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { Plan } from './entities/plan.entity';
import { PlanFeature } from './entities/plan-feature.entity';
import { UserPack } from './entities/user-pack.entity';
import { PaymentsModule } from '../payments/payments.module';
import { StripeModule } from '../payments/modules/stripe/stripe.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Plan, PlanFeature, UserPack]),
        PaymentsModule,
        forwardRef(() => StripeModule),
    ],
    controllers: [PlansController],
    providers: [PlansService],
    exports: [PlansService],
})
export class PlansModule {}
