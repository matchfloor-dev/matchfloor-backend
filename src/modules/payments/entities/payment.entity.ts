import { CurrencyPlan } from "src/modules/plans/enum/plans-types.enum";
import { BaseEntity } from "src/shared/entities/base.entity";
import { Column } from "typeorm";
import { PaymentTypes } from "../enums/payment-types.enum";

/**
 * Base entity for any type of payment.
*/
export abstract class Payment extends BaseEntity {

    @Column({ type: 'bigint', nullable: true })
    paidAt: number;

    @Column({ type: "decimal", precision: 8, scale: 2, nullable: false })
    amount: number;

    @Column({
        type: 'enum',
        enum: CurrencyPlan,
        nullable: false
    })
    currency: CurrencyPlan;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    paymentId: string;

    @Column({ type: 'enum', enum: PaymentTypes, nullable: true })
    paymentMethod: string;

    @Column({ type: 'varchar', length: 512, nullable: true })
    receiptUrl: string;
}