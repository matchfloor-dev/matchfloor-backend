import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsBoolean,
    IsEnum,
} from 'class-validator';

// enum
import { AppointmentStatus } from '../enum/appointment-status.enum';

export class UpdateAppointmentDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    date?: string;

    @IsNumber()
    @IsNotEmpty()
    @IsOptional()
    hour?: number;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    duration?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    notes?: string;

    @IsBoolean()
    @IsOptional()
    ownerConfirmation?: boolean;

    @IsBoolean()
    @IsOptional()
    agentConfirmation?: boolean;

    @IsNotEmpty()
    @IsEnum(AppointmentStatus)
    @IsOptional()
    status?: AppointmentStatus;
}
