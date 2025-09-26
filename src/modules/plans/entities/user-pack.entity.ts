import { BaseEntity } from 'src/shared/entities/base.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { CurrencyPlan } from '../enum/plans-types.enum';
import { Subscription } from 'src/modules/subscriptions/entities/subscriptions.entity';

@Entity('user_packs')
@Index(['name', 'isDeleted'], { unique: true })
export class UserPack extends BaseEntity {
    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description: string;

    @Column({ type: 'int', nullable: false })
    userCount: number;

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

    @Column({ type: 'varchar', length: 255, nullable: true })
    monthlyStripePriceId: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    annualStripePriceId: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    stripeProductId: string;

    @OneToMany(() => Subscription, subscription => subscription.pack)
    subscriptions: Subscription[];
} 