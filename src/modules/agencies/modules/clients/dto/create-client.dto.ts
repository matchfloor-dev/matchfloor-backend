import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

// decorators
import { IsRequired } from 'src/shared/decorators/is-required.decorator';

export class CreateClientDto {
    @IsString()
    @IsNotEmpty()
    @IsRequired()
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsRequired()
    email: string;

    @IsString()
    @IsOptional()
    phone?: string;
}
