import { Expose } from 'class-transformer';

export class ReadPlanFeatureDto {
    @Expose()
    id: number;

    @Expose()
    description: string;

    @Expose()
    order: number;
} 