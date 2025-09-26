import { BaseEntity } from 'src/shared/entities/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Plan } from './plan.entity';

@Entity('plan_features')
export class PlanFeature extends BaseEntity {
    @Column({ type: 'varchar', length: 1000, nullable: false })
    description: string;

    @Column({ type: 'int', nullable: false })
    order: number;

    @ManyToOne(() => Plan, (plan) => plan.features, {
        onDelete: 'CASCADE',
    })
    plan: Plan;
} 