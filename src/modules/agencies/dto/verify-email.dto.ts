import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { IsRequired } from "src/shared/decorators/is-required.decorator";

export class VerifyEmailDto {

    @IsString()
    @IsNotEmpty()
    @IsRequired()
    email: string;

    @IsNotEmpty()
    @IsRequired()
    @IsNumber()
    @Type(() => Number)
    code: number;
}