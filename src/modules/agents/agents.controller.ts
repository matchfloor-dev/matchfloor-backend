import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';

import { plainToClass } from 'class-transformer';

// services
import { AgentsService } from './agents.service';

// dto
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { ReadAgentDto } from './dto/read-agent.dto';
import { GenericResponse } from 'src/shared/genericResponse.dto';
import { HomeSearchItemDto } from 'src/shared/dto/home-search-item.dto';
import { ReadOwnerDto } from '../agencies/dto/read-owner.dto';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import { ReadUpdateAgentProfile } from './dto/read-agent-profile.dto';

// guards
import { AgentSessionGuard } from '../auth/guards/agent-session.guard';
import { AgencySessionGuard } from '../auth/guards/agency-session.guard';
import { ReadAgentForAgencyDto } from './dto/read-agent-for-agency.dto';

@Controller('agencies/:agencyId/agents')
export class AgentsController {
    constructor(private readonly agentsService: AgentsService) {}

    @UseGuards(AgencySessionGuard)
    @Post()
    async create(
        @Body() createAgentDto: CreateAgentDto,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadAgentDto>> {
        const agent = await this.agentsService.create(createAgentDto, agencyId);
        const agentResponse = plainToClass(ReadAgentDto, agent, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadAgentDto>(agentResponse);
    }

    @UseGuards(AgencySessionGuard)
    @Get(':id/residence-only-agent')
    async residenceOnlyAgent(
        @Param('id') id: string,
    ): Promise<GenericResponse<boolean>> {
        const onlyAgent = await this.agentsService.checkAgentResidences(
            parseInt(id),
        );
        return new GenericResponse<boolean>(onlyAgent);
    }

    @UseGuards(AgentSessionGuard)
    @Get(':id/pending-mails')
    async getPendingMails(
        @Param('id') id: string,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<any[]>> {
        const pendingMails = await this.agentsService.getPendingMails(
            +id,
            +agencyId,
        );
        return new GenericResponse<any[]>(pendingMails);
    }

    @UseGuards(AgentSessionGuard)
    @Get(':id/read-mails')
    async getMails(@Param('id') id: string): Promise<GenericResponse<any[]>> {
        const mails = await this.agentsService.getReadMails(+id);
        return new GenericResponse<any[]>(mails);
    }

    @UseGuards(AgencySessionGuard)
    @Get()
    async getAll(
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadAgentForAgencyDto[]>> {
        const agents = await this.agentsService.getAgentsForAgency(agencyId);
        // const agentsResponse = agents.map((agent) =>
        //     plainToClass(ReadAgentForAgencyDto, agent, {
        //         excludeExtraneousValues: true,
        //     }),
        // );
        return new GenericResponse<ReadAgentForAgencyDto[]>(agents);
    }

    @UseGuards(AgentSessionGuard)
    @Get(':id')
    async getById(
        @Param('id') id: string,
    ): Promise<GenericResponse<ReadAgentDto>> {
        const agent = await this.agentsService.getById(+id);
        const agentResponse = plainToClass(ReadAgentDto, agent, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadAgentDto>(agentResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Get(':id/appointments')
    async getAppointments(
        @Param('id') id: string,
    ): Promise<GenericResponse<any>> {
        const appointments =
            await this.agentsService.getAgentCalendarAppointments(+id);
        return new GenericResponse<any>(appointments);
    }

    @UseGuards(AgencySessionGuard)
    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateAgentDto: UpdateAgentDto,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadAgentDto>> {
        const agent = await this.agentsService.update(
            id,
            updateAgentDto,
            agencyId,
        );
        const agentResponse = plainToClass(ReadAgentDto, agent, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadAgentDto>(agentResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Put(':id/update-profile')
    async updateAgentProfile(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateAgentProfileDto: UpdateAgentProfileDto,
    ): Promise<GenericResponse<ReadUpdateAgentProfile>> {
        const agent = await this.agentsService.UpdateAgentProfile(
            id,
            updateAgentProfileDto,
        );
        const agentResponse = plainToClass(ReadAgentDto, agent, {
            excludeExtraneousValues: true,
        });

        return new GenericResponse<ReadUpdateAgentProfile>(agentResponse);
    }

    @UseGuards(AgencySessionGuard)
    @Delete(':id')
    async delete(@Param('id') id: string): Promise<GenericResponse<null>> {
        await this.agentsService.delete(parseInt(id));
        return new GenericResponse<null>(null);
    }

    @UseGuards(AgentSessionGuard)
    @Get(':id/home-search')
    async getHomeSearch(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GenericResponse<HomeSearchItemDto[]>> {
        const items: HomeSearchItemDto[] =
            await this.agentsService.getHomeSearch(id);
        return new GenericResponse<HomeSearchItemDto[]>(items);
    }

    @UseGuards(AgentSessionGuard)
    @Get(':id/owner')
    async getOwner(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GenericResponse<ReadOwnerDto>> {
        const owner: ReadOwnerDto = await this.agentsService.getOwner(id);
        return new GenericResponse<ReadOwnerDto>(owner);
    }
}
