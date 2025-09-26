import { Expose } from 'class-transformer';

export class NotificationAppointmentDto {
    @Expose()
    date: string;

    @Expose()
    hour: number;

    @Expose()
    duration: number;

    @Expose()
    notes: string;

    @Expose()
    clientName: string;

    @Expose()
    clientEmail: string;

    @Expose()
    clientPhone: string;

    @Expose()
    residenceName: string;

    @Expose()
    residenceOwnerEmail: string;

    @Expose()
    agentName: string;

    @Expose()
    agentEmail: string;
}
