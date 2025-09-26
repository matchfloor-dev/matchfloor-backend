import { CurrencyPlan } from "src/modules/plans/enum/plans-types.enum";
import { PaymentReasons } from "../enums/payment-reasons.enum";

export class PaymentDetailsDto {
    price: number;
    reason: PaymentReasons;
    mode: 'payment' | 'subscription';
    currency: CurrencyPlan;
    item: {
        name: string;
        quantity: number;
    }
    metadata: PaymentSubscriptionMetadata;
    freeTrial?: boolean;
}

export class PaymentSubscriptionMetadata {
    subscriptionPaymentId: number;
}