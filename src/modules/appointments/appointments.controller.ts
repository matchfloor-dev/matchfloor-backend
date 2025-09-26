import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';

// services
import { AppointmentsService } from './appointments.service';
import { AvailabilityService } from './availability.service';

//dto
import { GenericResponse } from 'src/shared/genericResponse.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

// guards
import { AgentSessionGuard } from 'src/modules/auth/guards/agent-session.guard';
import { WidgetSessionGuard } from 'src/modules/auth/guards/widget-session.guard';

// decorators
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { SanitizeBodyPipe } from 'src/pipes/sanitize-body.pipe';

@Controller('agencies/:agencyId/residences/:residenceId')
export class AppointmentsController {
    constructor(
        private readonly appointmentsService: AppointmentsService,
        private readonly availabilityService: AvailabilityService,
    ) {}

    @UseGuards(WidgetSessionGuard)
    // @UsePipes(new SanitizeBodyPipe())
    @Post('/appointments')
    async create(
        @Body(new SanitizeBodyPipe())
        createAppointmentDto: CreateAppointmentDto,
        @Param('residenceId') residenceId: number,
        @Param('agencyId') agencyId: number,
    ) {
        // create appointment
        const appointment = await this.appointmentsService.create(
            {
                ...createAppointmentDto,
            },
            residenceId,
            agencyId,
        );

        return appointment;
    }

    @UseGuards(WidgetSessionGuard)
    @Get('/availability')
    async getAll(
        @Param('residenceId') residenceId: number,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<any>> {
        const appointments =
            await this.availabilityService.getResidenceAvailability(
                residenceId,
                agencyId,
            );

        return new GenericResponse<any>(appointments);
    }

    @UseGuards(AgentSessionGuard)
    @Get('/appointments')
    async getAppointments(
        @Param('residenceId') residenceId: number,
    ): Promise<GenericResponse<any>> {
        const appointments =
            await this.availabilityService.getResidenceAppointments(
                residenceId,
            );
        return new GenericResponse<any>(appointments);
    }

    @Public()
    @Put('/appointments/:appointmentId/status')
    async updateStatus(
        @Body('token') token: string,
    ): Promise<GenericResponse<any>> {
        const appointment = await this.appointmentsService.updateStatus(token);
        return new GenericResponse<any>(appointment);
    }

    @Public()
    @Get('/appointments/:appointmentId/appointmentDetails')
    async getAppointmentDetails(
        @Query('token') token: string,
    ): Promise<GenericResponse<any>> {
        const appointment =
            await this.appointmentsService.getAppointmentDetailsFromToken(
                token,
            );

        return new GenericResponse<any>(appointment);
    }

    @Public()
    @Put('/appointments/:appointmentId/reschedule')
    async rescheduleAppointment(
        @Query('token') token: string,
        @Body('day') day: string,
        @Body('hour') hour: number,
    ): Promise<GenericResponse<any>> {
        const appointment =
            await this.appointmentsService.updateRescheduleAppointment(
                token,
                day,
                hour,
            );

        return new GenericResponse<any>(appointment);
    }
}
