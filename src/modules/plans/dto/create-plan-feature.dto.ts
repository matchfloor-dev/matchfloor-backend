import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePlanFeatureDto {
    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsNumber()
    order: number;
}