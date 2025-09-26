import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class VerifyEmailDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    code: number;
} 