import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { TypeOrmModule } from '@nestjs/typeorm';

// entities
import { SubscriptionPayment } from '../../entities/subscription-payment.entity';
import { Agency } from 'src/modules/agencies/entities/agency.entity';

// modules
import { MailsModule } from 'src/modules/mails/mails.module';
import { JobsModule } from 'src/modules/jobs/jobs.module';
@Module({
  providers: [StripeService],
  exports: [StripeService],
  imports: [TypeOrmModule.forFeature([SubscriptionPayment, Agency]), MailsModule, JobsModule],
})
export class StripeModule {}
