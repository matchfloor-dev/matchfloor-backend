import { Expose } from "class-transformer";

export class PaymentCreatedDto {

    @Expose()
    url: string;
}