import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    UseGuards,
    Query,
} from '@nestjs/common';

import { plainToClass } from 'class-transformer';

// services
import { ResidencesService } from './residences.service';

// dto
import { CreateResidenceDto } from './dto/create-residence.dto';
import { UpdateResidenceDto } from './dto/update-residence.dto';
import { ReadResidenceDto } from './dto/read-residence.dto';
import { GenericResponse } from 'src/shared/genericResponse.dto';

// guards
import { AgentSessionGuard } from '../auth/guards/agent-session.guard';
import { AgencySessionGuard } from '../auth/guards/agency-session.guard';
import { WidgetSessionGuard } from '../auth/guards/widget-session.guard';
import { ReadResidenceWidgetDto } from './dto/read-residence-widget.dto';

@Controller('agencies/:agencyId/residences')
export class ResidencesController {
    constructor(private readonly residencesService: ResidencesService) {}

    @UseGuards(AgentSessionGuard)
    @Post()
    async create(
        @Body() createResidenceDto: CreateResidenceDto,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadResidenceDto>> {
        const residence = await this.residencesService.create(
            createResidenceDto,
            agencyId,
        );
        const residenceResponse = plainToClass(ReadResidenceDto, residence, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadResidenceDto>(residenceResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Get()
    async getAll(
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadResidenceDto[]>> {
        const residences = await this.residencesService.getAll(agencyId);
        const residencesResponse = residences.map((residence) =>
            plainToClass(ReadResidenceDto, residence, {
                excludeExtraneousValues: true,
            }),
        );
        return new GenericResponse<ReadResidenceDto[]>(residencesResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Get('/appointments')
    async getAllResidencesAppointments(
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadResidenceDto[]>> {
        const residences =
            await this.residencesService.getAllResidencesAppointments(agencyId);
        const residencesResponse = residences.map((residence) =>
            plainToClass(ReadResidenceDto, residence, {
                excludeExtraneousValues: true,
            }),
        );
        return new GenericResponse<ReadResidenceDto[]>(residencesResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Get(':id')
    async getById(
        @Param('id') id: number,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadResidenceDto>> {
        const residence = await this.residencesService.getById(id, agencyId);
        const residenceResponse = plainToClass(ReadResidenceDto, residence, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadResidenceDto>(residenceResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Put(':id')
    async update(
        @Param('id') id: number,
        @Body() updateResidenceDto: UpdateResidenceDto,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadResidenceDto>> {
        const residence = await this.residencesService.update(
            id,
            updateResidenceDto,
            agencyId,
        );
        const residenceResponse = plainToClass(ReadResidenceDto, residence, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadResidenceDto>(residenceResponse);
    }

    @UseGuards(AgencySessionGuard)
    @Delete(':id')
    async delete(
        @Param('id') id: number,
    ): Promise<GenericResponse<ReadResidenceDto>> {
        const residence = await this.residencesService.delete(id);
        const residenceResponse = plainToClass(ReadResidenceDto, residence, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadResidenceDto>(residenceResponse);
    }

    @UseGuards(WidgetSessionGuard)
    @Get('widget/find-by-ids')
    async getResidencesByIdentifier(
        @Query('ids') identifiers: string,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadResidenceWidgetDto[]>> {
        const response = await this.residencesService.getResidencesByIdentifier(
            identifiers,
            agencyId,
        );
        const residenceResponse = plainToClass(
            ReadResidenceWidgetDto,
            response,
            {
                excludeExtraneousValues: true,
            },
        );
        return new GenericResponse<ReadResidenceWidgetDto[]>(residenceResponse);
    }
}
