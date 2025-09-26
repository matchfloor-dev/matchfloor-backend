import { Expose } from 'class-transformer';

export class ReadAppointmentDto {
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
    agentId: string;

    @Expose()
    clientId: string;

    @Expose()
    residenceId: string;

    @Expose()
    ownerConfirmation: boolean;

    @Expose()
    agentConfirmation: boolean;

    @Expose()
    status: string;
}
