import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';

import { plainToClass } from 'class-transformer';

// services
import { WorkingDaysService } from './working-days.service';

// dto
import { CreateWorkingDayDto } from './dto/create-working-day.dto';
import { UpdateWorkingDayDto } from './dto/update-working-day.dto';
import { UpdateWorkingTimeSlotDto } from './dto/update-working-time-slot.dto';
import { ReadWorkingDayDto } from './dto/read-working-day.dto';
import { ReadWorkingTimeSlotDto } from './dto/read-working-time-slot.dto';
import { GenericResponse } from 'src/shared/genericResponse.dto';

// guards
import { AgencySessionGuard } from 'src/modules/auth/guards/agency-session.guard';

@Controller('agencies/:agencyId/working-days')
export class WorkingDaysController {
    constructor(private readonly workingDaysService: WorkingDaysService) {}

    @UseGuards(AgencySessionGuard)
    @Post()
    async create(
        @Body() createWorkingDayDto: CreateWorkingDayDto,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadWorkingDayDto>> {
        const workingDay = await this.workingDaysService.create(
            createWorkingDayDto,
            agencyId,
        );
        const workingDayResponse = plainToClass(ReadWorkingDayDto, workingDay, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadWorkingDayDto>(workingDayResponse);
    }

    @UseGuards(AgencySessionGuard)
    @Get()
    async getAll(
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadWorkingDayDto[]>> {
        const workingDays = await this.workingDaysService.getAll(agencyId);
        const workingDaysResponse = workingDays.map((workingDay) =>
            plainToClass(ReadWorkingDayDto, workingDay, {
                excludeExtraneousValues: true,
            }),
        );
        return new GenericResponse<ReadWorkingDayDto[]>(workingDaysResponse);
    }

    @UseGuards(AgencySessionGuard)
    @Get(':id')
    async getById(
        @Param('id') id: string,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadWorkingDayDto>> {
        // Update return type
        const workingDay = await this.workingDaysService.getById(+id, agencyId);
        const workingDayResponse = plainToClass(ReadWorkingDayDto, workingDay, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadWorkingDayDto>(workingDayResponse);
    }

    @UseGuards(AgencySessionGuard)
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateWorkingDayDto: UpdateWorkingDayDto,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadWorkingDayDto>> {
        const workingDay = await this.workingDaysService.update(
            +id,
            updateWorkingDayDto,
            agencyId,
        );
        const workingDayResponse = plainToClass(ReadWorkingDayDto, workingDay, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadWorkingDayDto>(workingDayResponse);
    }

    @UseGuards(AgencySessionGuard)
    @Put(':id/time-slots/:timeSlotId')
    async updateTimeSlot(
        @Param('id') id: string,
        @Param('timeSlotId') timeSlotId: string,
        @Body() updateTimeSlotDto: UpdateWorkingTimeSlotDto,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadWorkingTimeSlotDto>> {
        const workingDay = await this.workingDaysService.updateTimeSlot(
            +id,
            +timeSlotId,
            updateTimeSlotDto,
            agencyId,
        );
        const workingDayResponse = plainToClass(
            ReadWorkingTimeSlotDto,
            workingDay,
            {
                excludeExtraneousValues: true,
            },
        );
        return new GenericResponse<ReadWorkingTimeSlotDto>(workingDayResponse);
    }

    @UseGuards(AgencySessionGuard)
    @Delete(':id')
    async delete(
        @Param('id') id: string,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<null>> {
        await this.workingDaysService.delete(+id, agencyId);
        return new GenericResponse<null>(null);
    }

    @UseGuards(AgencySessionGuard)
    @Delete(':id/time-slots/:timeSlotId')
    async deleteTimeSlot(
        @Param('id') id: string,
        @Param('timeSlotId') timeSlotId: string,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<null>> {
        await this.workingDaysService.deleteTimeSlot(
            +id,
            +timeSlotId,
            agencyId,
        );
        return new GenericResponse<null>(null);
    }
}
