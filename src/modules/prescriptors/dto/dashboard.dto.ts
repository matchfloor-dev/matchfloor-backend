import { Expose } from 'class-transformer';

class MontlyReferralsDto {
    @Expose()
    month: string;

    @Expose()
    referrals: number;
}

export class DashboardDto {
    @Expose()
    totalReferredAgencies: number;

    @Expose()
    activeReferredAgencies: number;

    @Expose()
    totalEarnings: number;

    @Expose()
    montlyReferrals: MontlyReferralsDto[];
} 