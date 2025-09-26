import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';

import { plainToClass } from 'class-transformer';

// services
import { AgentWorkingDaysService } from './working-days.service';

// dto
import { CreateWorkingDayDto } from './dto/create-working-day.dto';
import { UpdateWorkingDayDto } from './dto/update-working-day.dto';
import { ReadWorkingDayDto } from './dto/read-working-day.dto';
import { ReadWorkingTimeSlotDto } from './dto/read-working-time-slot.dto';
import { GenericResponse } from 'src/shared/genericResponse.dto';
import { UpdateWorkingTimeSlotDto } from './dto/update-working-time-slot.dto';

// guards
import { AgentSessionGuard } from '../../../auth/guards/agent-session.guard';

@Controller('agents/:agentId/working-days')
export class WorkingDaysController {
    constructor(private readonly workingDaysService: AgentWorkingDaysService) {}

    @UseGuards(AgentSessionGuard)
    @Post()
    async create(
        @Body() createWorkingDayDto: CreateWorkingDayDto,
        @Param('agentId') agentId: number,
    ): Promise<GenericResponse<ReadWorkingDayDto>> {
        const workingDay = await this.workingDaysService.create(
            createWorkingDayDto,
            agentId,
        );
        const workingDayResponse = plainToClass(ReadWorkingDayDto, workingDay, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadWorkingDayDto>(workingDayResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Get()
    async getAll(
        @Param('agentId') agentId: number,
    ): Promise<GenericResponse<ReadWorkingDayDto[]>> {
        const workingDays = await this.workingDaysService.getAll(agentId);
        const workingDaysResponse = workingDays.map((workingDay) =>
            plainToClass(ReadWorkingDayDto, workingDay, {
                excludeExtraneousValues: true,
            }),
        );
        return new GenericResponse<ReadWorkingDayDto[]>(workingDaysResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Get('availability')
    async getAvailability(
        @Param('agentId') agentId: number,
    ): Promise<GenericResponse<any>> {
        const availability =
            await this.workingDaysService.getAvailability(agentId);
        return new GenericResponse<any>(availability);
    }

    @UseGuards(AgentSessionGuard)
    @Get(':id')
    async getById(
        @Param('id') id: string,
        @Param('agentId') agentId: number,
    ): Promise<GenericResponse<ReadWorkingDayDto>> {
        const workingDay = await this.workingDaysService.getById(+id, agentId);
        const workingDayResponse = plainToClass(ReadWorkingDayDto, workingDay, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadWorkingDayDto>(workingDayResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateWorkingDayDto: UpdateWorkingDayDto,
        @Param('agentId') agentId: number,
    ): Promise<GenericResponse<ReadWorkingDayDto>> {
        const workingDay = await this.workingDaysService.update(
            +id,
            updateWorkingDayDto,
            agentId,
        );
        const workingDayResponse = plainToClass(ReadWorkingDayDto, workingDay, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadWorkingDayDto>(workingDayResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Put(':id/time-slots/:timeSlotId')
    async updateTimeSlot(
        @Param('id') id: string,
        @Param('timeSlotId') timeSlotId: number,
        @Body() updateTimeSlotDto: UpdateWorkingTimeSlotDto,
        @Param('agentId') agentId: number,
    ): Promise<GenericResponse<ReadWorkingTimeSlotDto>> {
        const updatedTimeSlot = await this.workingDaysService.updateTimeSlot(
            +id,
            +timeSlotId,
            updateTimeSlotDto,
            agentId,
        );
        const workingDayResponse = plainToClass(
            ReadWorkingTimeSlotDto,
            updatedTimeSlot,
            {
                excludeExtraneousValues: true,
            },
        );
        return new GenericResponse<ReadWorkingTimeSlotDto>(workingDayResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Delete(':id/time-slots/:timeSlotId')
    async deleteTimeSlot(
        @Param('id') id: string,
        @Param('timeSlotId') timeSlotId: number,
        @Param('agentId') agentId: number,
    ): Promise<GenericResponse<null>> {
        await this.workingDaysService.deleteTimeSlot(+id, +timeSlotId, agentId);
        return new GenericResponse<null>(null);
    }

    @UseGuards(AgentSessionGuard)
    @Delete(':id')
    async delete(
        @Param('id') id: string,
        @Param('agentId') agentId: number,
    ): Promise<GenericResponse<null>> {
        await this.workingDaysService.delete(+id, agentId);
        return new GenericResponse<null>(null);
    }
}
