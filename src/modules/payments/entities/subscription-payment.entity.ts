import { Column, Entity, ManyToOne } from 'typeorm';

// entities
import { Payment } from './payment.entity';
import { Subscription } from 'src/modules/subscriptions/entities/subscriptions.entity';

@Entity()
export class SubscriptionPayment extends Payment {
    @ManyToOne(() => Subscription, (subscription) => subscription.payments)
    subscription: Subscription;

    @Column({ type: 'smallint', nullable: false })
    subscriptionId: number;

    @Column({ type: 'bigint', nullable: false })
    startPeriodDate: number;

    @Column({ type: 'bigint', nullable: false })
    endPeriodDate: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    invoiceId: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    invoiceNumber: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    paymentIntentId: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    recepitNumber: string;

    @Column({ type: 'varchar', length: 512, nullable: true })
    hostedInvoiceUrl: string;

}
