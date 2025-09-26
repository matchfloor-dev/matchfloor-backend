import {
    Controller,
    Get,
    Param,
    Post,
    Body,
    Put,
    Delete,
    UseGuards,
    ParseIntPipe,
    Req,
} from '@nestjs/common';

import { plainToClass } from 'class-transformer';

// services
import { AgenciesService } from './agencies.service';

// dto
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { ReadAgencyDto } from './dto/read-agency.dto';
import { GenericResponse } from 'src/shared/genericResponse.dto';

// guards
import { AgencySessionGuard } from '../auth/guards/agency-session.guard';
import { AgentSessionGuard } from '../auth/guards/agent-session.guard';
import { AdminSessionGuard } from '../auth/guards/admin-session.guard';
import { HomeSearchItemDto } from 'src/shared/dto/home-search-item.dto';
import { ReadOwnerDto } from './dto/read-owner.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { WidgetSessionGuard } from '../auth/guards/widget-session.guard';
import { Request } from 'express';

@Controller('agencies')
export class AgenciesController {
    constructor(private readonly agenciesService: AgenciesService) {}

    @UseGuards(AdminSessionGuard)
    @Post()
    async create(
        @Body() createAgencyDto: CreateAgencyDto,
    ): Promise<GenericResponse<ReadAgencyDto>> {
        const agency = await this.agenciesService.create(createAgencyDto);
        const agencyResponse = plainToClass(ReadAgencyDto, agency, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadAgencyDto>(agencyResponse);
    }

    @UseGuards(AdminSessionGuard)
    @Get()
    async getAll(): Promise<GenericResponse<ReadAgencyDto[]>> {
        const agencies = await this.agenciesService.getAll();
        const agenciesResponse = agencies.map((agency) =>
            plainToClass(ReadAgencyDto, agency, {
                excludeExtraneousValues: true,
            }),
        );
        return new GenericResponse<ReadAgencyDto[]>(agenciesResponse);
    }

    @UseGuards(WidgetSessionGuard)
    @Get('/widget')
    async getWidget(
        @Req() req: Request,
    ): Promise<GenericResponse<ReadAgencyDto>> {
        const widget = await this.agenciesService.getById(req['agencyId']);
        const widgetResponse = plainToClass(ReadAgencyDto, widget, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadAgencyDto>(widgetResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Get(':id')
    async getById(
        @Param('id') id: string,
    ): Promise<GenericResponse<ReadAgencyDto>> {
        const agency = await this.agenciesService.getById(parseInt(id));
        const agencyResponse = plainToClass(ReadAgencyDto, agency, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadAgencyDto>(agencyResponse);
    }

    @UseGuards(AgencySessionGuard)
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateAgencyDto: UpdateAgencyDto,
    ): Promise<GenericResponse<ReadAgencyDto>> {
        const agency = await this.agenciesService.update(
            parseInt(id),
            updateAgencyDto,
        );
        const agencyResponse = plainToClass(ReadAgencyDto, agency, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadAgencyDto>(agencyResponse);
    }

    @UseGuards(AdminSessionGuard)
    @Delete(':id')
    async delete(@Param('id') id: string): Promise<GenericResponse<null>> {
        await this.agenciesService.delete(parseInt(id));
        return new GenericResponse<null>(null);
    }

    @UseGuards(AgencySessionGuard)
    @Get(':id/home-search')
    async getHomeSearch(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GenericResponse<HomeSearchItemDto[]>> {
        const items: HomeSearchItemDto[] =
            await this.agenciesService.getHomeSearch(id);
        return new GenericResponse<HomeSearchItemDto[]>(items);
    }

    @UseGuards(AgencySessionGuard)
    @Get(':id/owner')
    async getOwner(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GenericResponse<ReadOwnerDto>> {
        const owner: ReadOwnerDto = await this.agenciesService.getOwner(id);
        return new GenericResponse<ReadOwnerDto>(owner);
    }

    @UseGuards(AgencySessionGuard)
    @Get(':id/appointments')
    async getAppointments(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GenericResponse<any>> {
        const appointments =
            await this.agenciesService.getAgencyCalendarAppointments(id);
        return new GenericResponse<any>(appointments);
    }

    // PUBLIC ROUTES
    @Post('register')
    async register(
        @Body() createAgencyDto: CreateAgencyDto,
    ): Promise<GenericResponse<ReadAgencyDto>> {
        const agency = await this.agenciesService.register(createAgencyDto);
        const agencyResponse = plainToClass(ReadAgencyDto, agency, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadAgencyDto>(agencyResponse);
    }

    @Post('verify-email')
    async verifyEmail(
        @Body() data: VerifyEmailDto,
    ): Promise<GenericResponse<{ checkoutUrl: string }>> {
        const res = await this.agenciesService.verifyEmail(data);
        return new GenericResponse(res);
    }

}
