import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsNumber,
    IsOptional,
} from 'class-validator';
import { NotificationType } from '../enum/notification-type.enum';

// decorators
import { IsRequired } from 'src/shared/decorators/is-required.decorator';

export class CreateNotificationDto {
    @IsRequired()
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsRequired()
    @IsString()
    @IsNotEmpty()
    body: string;

    @IsEnum(NotificationType)
    type: NotificationType;

    @IsRequired()
    @IsNotEmpty()
    @IsNumber()
    agencyId: number;

    @IsOptional()
    @IsNumber()
    appointmentId: number;
}
