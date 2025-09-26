import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
    IsArray,
    Min,
} from 'class-validator';
import { IsRequired } from 'src/shared/decorators/is-required.decorator';
import { Type } from 'class-transformer';

// enum
import { CurrencyPlan } from '../enum/plans-types.enum';
import { CreatePlanFeatureDto } from './create-plan-feature.dto';

export class CreatePlanDto {
    @IsString()
    @IsNotEmpty()
    @IsRequired()
    name: string;

    @IsString()
    @IsOptional()
    description: string;

    @IsInt()
    @Min(0)
    @IsNotEmpty()
    @IsRequired()
    maxAPI: number;

    @IsInt()
    @Min(0)
    @IsNotEmpty()
    @IsRequired()
    monthlyPrice: number;

    @IsInt()
    @Min(0)
    @IsNotEmpty()
    @IsRequired()
    annualPrice: number;

    @IsEnum(CurrencyPlan)
    @IsOptional()
    @IsRequired()
    currencyPlan: CurrencyPlan;

    @IsBoolean()
    @IsRequired()
    isPublic: boolean;

    @IsBoolean()
    @IsOptional()
    @IsRequired()
    isActive: boolean;

    @IsBoolean()
    @IsOptional()
    isDefaultPlan?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePlanFeatureDto)
    @IsOptional()
    features?: CreatePlanFeatureDto[];
}
