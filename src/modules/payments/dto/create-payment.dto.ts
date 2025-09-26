import { IsEnum, IsNotEmpty, IsNumber } from "class-validator";
import { Type } from "class-transformer";

// decorators
import { IsRequired } from "src/shared/decorators/is-required.decorator";

// enums
import { PaymentReasons } from "../enums/payment-reasons.enum";

export class CreatePaymentDto {

    @IsRequired()
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    agencyId: number;


    @IsRequired()
    @IsNotEmpty()
    @IsEnum(PaymentReasons)
    reason: PaymentReasons;
}