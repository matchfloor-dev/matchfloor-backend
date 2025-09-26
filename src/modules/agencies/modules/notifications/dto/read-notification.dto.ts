import { Expose, Type } from 'class-transformer';
import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';

// enum
import { NotificationType } from '../enum/notification-type.enum';

//dto
import { NotificationAppointmentDto } from './read-appointment.dto';

export class ReadNotificationDto {
    @Expose()
    @IsNumber()
    id: string;

    @Expose()
    @IsString()
    title: string;

    @Expose()
    @IsString()
    body: string;

    @Expose()
    @IsEnum(NotificationType)
    type: NotificationType;

    @Expose()
    @IsNumber()
    agencyId: string;

    @Expose()
    @IsOptional()
    @Type(() => NotificationAppointmentDto)
    appointment?: NotificationAppointmentDto;

    @Expose()
    @IsString()
    createdAt: string;
}
