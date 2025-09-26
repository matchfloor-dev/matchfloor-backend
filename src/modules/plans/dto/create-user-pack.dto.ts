import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CurrencyPlan } from '../enum/plans-types.enum';

export class CreateUserPackDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @Min(1)
    userCount: number;

    @IsNumber()
    @Min(0)
    monthlyPrice: number;

    @IsNumber()
    @Min(0)
    annualPrice: number;

    @IsEnum(CurrencyPlan)
    @IsOptional()
    currencyPlan?: CurrencyPlan;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
} 