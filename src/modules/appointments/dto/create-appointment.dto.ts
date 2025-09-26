import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

// decorators
import { IsRequired } from 'src/shared/decorators/is-required.decorator';

export class CreateAppointmentDto {
    @IsString()
    @IsNotEmpty()
    @IsRequired()
    date: string;

    @IsNumber()
    @IsNotEmpty()
    @IsRequired()
    hour: number;

    @IsNumber()
    @IsNotEmpty()
    @IsOptional()
    duration?: number;

    @IsString()
    @IsOptional()
    notes?: string;

    // client attributes
    @IsNumber()
    @IsOptional()
    clientId?: number;

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

    @IsBoolean()
    @IsOptional()
    ownerConfirmation?: boolean;

    @IsBoolean()
    @IsOptional()
    agentConfirmation?: boolean;
}
