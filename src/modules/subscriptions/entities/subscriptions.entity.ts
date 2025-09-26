import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

import { BaseEntity } from "src/shared/entities/base.entity"

// entities
import { Agency } from "src/modules/agencies/entities/agency.entity";
import { Plan } from "src/modules/plans/entities/plan.entity";
import { SubscriptionPayment } from "src/modules/payments/entities/subscription-payment.entity";
import { UserPack } from "src/modules/plans/entities/user-pack.entity";

@Entity('subscriptions')
export class Subscription extends BaseEntity {

    @ManyToOne(() => Agency, agency => agency.subscriptions)
    agency: Agency;

    @Column({ type: 'int', nullable: false })
    agencyId: number;

    @ManyToOne(() => Plan, plan => plan.subscriptions)
    plan: Plan;

    @Column({ type: 'int', nullable: false })
    planId: number;

    @ManyToOne(() => UserPack, pack => pack.subscriptions)
    pack?: UserPack;

    @Column({ type: 'int', nullable: true })
    packId?: number;

    @Column({ type: 'bigint', nullable: false })
    startDate: number;

    @Column({ type: 'bigint', nullable: true })
    endDate: number;

    @OneToMany(() => SubscriptionPayment, payment => payment.subscription)
    payments: SubscriptionPayment[];

    @Column({ type: 'varchar', length: 128, nullable: true })
    stripeSubscriptionId: string;
}