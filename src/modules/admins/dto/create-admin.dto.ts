import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

// decorators
import { IsRequired } from 'src/shared/decorators/is-required.decorator';

export class CreateAdminDto {
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

    @IsString()
    @IsNotEmpty()
    @IsRequired()
    firstName?: string;

    @IsString()
    @IsNotEmpty()
    @IsRequired()
    lastName?: string;
}
