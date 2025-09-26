import { Expose, Type } from "class-transformer";
import { ReadSubscriptionPaymentDto } from "src/modules/payments/dto/read-subscription-payment.dto";
import { ReadPlansDto } from "src/modules/plans/dto/read-plans.dto";

export class ReadSubscriptionDto {

    @Expose()
    startDate: number;

    @Expose()
    endDate: number;

    @Expose()
    @Type(() => ReadSubscriptionPaymentDto)
    payments: ReadSubscriptionPaymentDto[];

    @Expose()
    @Type(() => ReadPlansDto)
    plan: ReadPlansDto;

}