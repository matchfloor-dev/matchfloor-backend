import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsEmail, IsNumber, IsBoolean } from 'class-validator';

// decorators
import { IsRequired } from 'src/shared/decorators/is-required.decorator';

export class CreateAgencyDto {
    @IsString()
    @IsNotEmpty()
    @IsRequired()
    name: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    website?: string;

    @IsString()
    @IsEmail()
    @IsNotEmpty()
    @IsRequired()
    email: string;

    @IsString()
    @IsNotEmpty()
    @IsRequired()
    password: string;

    @IsString()
    @IsNotEmpty()
    @IsRequired()
    passwordConfirmation: string;

    @IsNotEmpty()
    @IsRequired()
    @IsNumber()
    @Type(() => Number)
    planId: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    packId?: number;

    @IsBoolean()
    @IsOptional()
    useFreeTrial?: boolean;

    @IsString()
    @IsOptional()
    prescriptorReferenceCode?: string;


    /// DEFAULT USER VALUES
    @IsString()
    @IsNotEmpty()
    @IsRequired()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @IsRequired()
    lastName: string;
}
