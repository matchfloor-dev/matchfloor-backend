import { BaseEntity } from 'src/shared/entities/base.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { CurrencyPlan } from '../enum/plans-types.enum';

// entities
import { Subscription } from 'src/modules/subscriptions/entities/subscriptions.entity';
import { PlanFeature } from './plan-feature.entity';

@Entity('plans')
@Index(['name', 'isDeleted'], { unique: true })
export class Plan extends BaseEntity {
    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description: string;

    @Column({ type: 'int', nullable: false })
    maxAPI: number;

    @Column({ type: 'double precision', nullable: false })
    monthlyPrice: number;

    @Column({ type: 'double precision', nullable: false })
    annualPrice: number;

    @Column({
        type: 'enum',
        enum: CurrencyPlan,
        default: CurrencyPlan.EUR,
    })
    currencyPlan: CurrencyPlan;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'boolean', default: false })
    isDefaultPlan: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    monthlyStripePriceId: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    annualStripePriceId: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    stripeProductId: string;

    // Subscriptions
    @OneToMany(() => Subscription, (subscription) => subscription.plan)
    subscriptions: Subscription[];

    @OneToMany(() => PlanFeature, (feature) => feature.plan, {
        cascade: true,
    })
    features: PlanFeature[];
}
