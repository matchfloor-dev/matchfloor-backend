import { Expose, Type } from 'class-transformer';

export class CalendarAppointmentDto {
    @Expose()
    id: number;

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
    status: string;
}

export class ReadCalendarAppointmentDto {
    @Expose()
    @Type(() => CalendarAppointmentDto)
    appointments: CalendarAppointmentDto[];

    @Expose()
    minHour: number;

    @Expose()
    maxHour: number;
}
