import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAdminDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    email?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    lastName?: string;
}
