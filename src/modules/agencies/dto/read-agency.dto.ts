import { Expose, Type } from 'class-transformer';
import { ReadSubscriptionDto } from 'src/modules/subscriptions/dto/read-subscription.dto';

export class ReadAgencyDto {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    address: string;

    @Expose()
    phone: string;

    @Expose()
    email: string;

    @Expose()
    website: string;

    @Expose()
    isActive: boolean;

    @Expose()
    isSubscriptionActive: boolean;

    @Expose()
    usedFreeTrial: boolean;

    @Expose()
    @Type(() => ReadSubscriptionDto)
    subscriptions: ReadSubscriptionDto[];
}
