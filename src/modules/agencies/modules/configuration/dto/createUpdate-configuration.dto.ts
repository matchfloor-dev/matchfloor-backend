import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateUpdateConfigurationDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsOptional()
    logoImage?: Express.Multer.File;

    @IsOptional()
    @IsString()
    primaryColor?: string;

    @IsOptional()
    @IsString()
    secondaryColor?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    maxScheduleDays?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    minScheduleDays?: number;
}
