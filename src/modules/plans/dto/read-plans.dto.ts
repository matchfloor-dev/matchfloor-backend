import { Expose, Type } from 'class-transformer';

// enum
import { CurrencyPlan } from '../enum/plans-types.enum';
import { ReadPlanFeatureDto } from './read-plan-feature.dto';

export class ReadPlansDto {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    description: string;

    @Expose()
    maxAPI: number;

    @Expose()
    monthlyPrice: number;

    @Expose()
    annualPrice: number;

    @Expose()
    currencyPlan: CurrencyPlan;

    @Expose()
    isActive: boolean;

    @Expose()
    isDefaultPlan: boolean;

    @Expose()
    @Type(() => ReadPlanFeatureDto)
    features: ReadPlanFeatureDto[];
}
