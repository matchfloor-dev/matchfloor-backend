import { Expose } from 'class-transformer';
import { CurrencyPlan } from '../enum/plans-types.enum';

export class ReadUserPackDto {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    description: string;

    @Expose()
    userCount: number;

    @Expose()
    monthlyPrice: number;

    @Expose()
    annualPrice: number;

    @Expose()
    currencyPlan: CurrencyPlan;
} 