import { Expose } from "class-transformer";

export class ReadSubscriptionPaymentDto {
    @Expose()
    id: number;

    @Expose()
    amount: number;

    @Expose()
    currency: string;

    @Expose()
    paidAt: number;

    @Expose()
    type: string;

    @Expose()
    receiptUrl: string;

    @Expose()
    description: string;

    @Expose()
    startPeriodDate: number;

    @Expose()
    endPeriodDate: number;
}
