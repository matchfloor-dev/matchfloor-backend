import { Expose, Type } from 'class-transformer';

// dto
import { ReadAgentDto } from '../../agents/dto/read-agent.dto';
import { ReadAppointmentDto } from 'src/modules/appointments/dto/read-appointment.dto';
import { ResidencesSources } from '../enum/residence-sources.enum';

export class ReadResidenceDto {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    ownerEmail: string;

    @Expose()
    source: ResidencesSources;

    @Expose()
    @Type(() => ReadAgentDto)
    agents: ReadAgentDto[];

    @Expose()
    @Type(() => ReadAppointmentDto)
    appointments: ReadAppointmentDto[];

    @Expose()
    allAgents: boolean;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}
