import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

// services
import { AssignedResidencesService } from './assigned-residences.service';

// guards
import { AgentSessionGuard } from 'src/modules/auth/guards/agent-session.guard';

// dto
import { GenericResponse } from 'src/shared/genericResponse.dto';
import { ReadResidenceDto } from 'src/modules/residences/dto/read-residence.dto';

@UseGuards(AgentSessionGuard)
@Controller('agents/:agentId/assigned-residences')
export class AssignedResidencesController {
    constructor(
        private readonly assignedResidencesService: AssignedResidencesService,
    ) {}

    @Get()
    async getAssignedResidences(
        @Param('agentId') agentId: number,
    ): Promise<GenericResponse<ReadResidenceDto[]>> {
        const assignedResidences =
            await this.assignedResidencesService.getAssignedResidences(agentId);

        const residences = assignedResidences.map((residence) =>
            plainToClass(ReadResidenceDto, residence, {
                excludeExtraneousValues: true,
            }),
        );

        return new GenericResponse<ReadResidenceDto[]>(residences);
    }
}
