import { Expose } from 'class-transformer';

export class ReferredAgencyDto {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    email: string;

    @Expose()
    createdAt: Date;

    @Expose()
    isActive: boolean;

    @Expose()
    isSubscriptionActive: boolean;
} 