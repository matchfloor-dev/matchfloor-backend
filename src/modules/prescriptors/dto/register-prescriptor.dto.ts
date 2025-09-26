import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    MaxLength,
    Matches,
    IsOptional,
} from 'class-validator';
import { Match } from 'src/shared/decorators/match.decorator';

export class RegisterPrescriptorDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(30)
    // @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    //     message: 'Password is too weak',
    // })
    password: string;

    @IsNotEmpty()
    @IsString()
    @Match('password', { message: 'Passwords do not match' })
    passwordConfirmation: string;

    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    @Matches(/^\+?[0-9]{8,15}$/, {
        message: 'Phone number must be valid',
    })
    phoneNumber?: string;
} 