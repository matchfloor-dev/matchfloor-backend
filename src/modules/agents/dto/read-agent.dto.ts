import { Expose, Type } from 'class-transformer';

// dto
import { ReadResidenceDto } from 'src/modules/residences/dto/read-residence.dto';
import { ReadAppointmentDto } from '../../appointments/dto/read-appointment.dto';

export class ReadAgentDto {
    @Expose()
    id: number;

    @Expose()
    email: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    agencyId: number;

    @Expose()
    @Type(() => ReadResidenceDto)
    residences: ReadResidenceDto[];

    @Expose()
    @Type(() => ReadAppointmentDto)
    appointments: ReadAppointmentDto[];

    @Expose()
    isActive: boolean;

    @Expose()
    isOwner: boolean;
}
