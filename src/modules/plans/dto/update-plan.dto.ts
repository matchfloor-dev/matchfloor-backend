import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanDto } from './create-plan.dto';
import {
    IsOptional,
    IsString,
    IsNumber,
    IsEnum,
    IsBoolean,
} from 'class-validator';
import { CurrencyPlan, PeriodPlan } from '../enum/plans-types.enum';

export class UpdatePlanDto extends PartialType(CreatePlanDto) {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    maxAPI?: number;

    @IsNumber()
    @IsOptional()
    price?: number;

    @IsEnum(PeriodPlan)
    @IsOptional()
    periodPlan?: PeriodPlan;

    @IsEnum(CurrencyPlan)
    @IsOptional()
    currencyPlan?: CurrencyPlan;

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsBoolean()
    @IsOptional()
    isDefaultPlan?: boolean;

    @IsNumber()
    @IsOptional()
    monthlyPrice?: number;

    @IsNumber()
    @IsOptional()
    annualPrice?: number;
}
