import {
    Controller,
    Get,
    Param,
    UseGuards,
    Delete,
    Body,
} from '@nestjs/common';

import { plainToClass } from 'class-transformer';

// services
import { AgencyNotificationsService } from './notifications.service';

//dto
import { ReadNotificationDto } from './dto/read-notification.dto';
import { GenericResponse } from 'src/shared/genericResponse.dto';

// guards
import { AgencySessionGuard } from 'src/modules/auth/guards/agency-session.guard';

//enum
import { NotificationType } from './enum/notification-type.enum';

@Controller('agencies/:agencyId/notifications')
export class NotificationsController {
    constructor(
        private readonly notificationsService: AgencyNotificationsService,
    ) {}

    @UseGuards(AgencySessionGuard)
    @Get()
    async getAll(
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadNotificationDto[]>> {
        const notifications = await this.notificationsService.getAll(agencyId);
        const notificationsResponse = notifications.map((notification) =>
            plainToClass(ReadNotificationDto, notification, {
                excludeExtraneousValues: true,
            }),
        );
        return new GenericResponse<ReadNotificationDto[]>(
            notificationsResponse,
        );
    }

    @UseGuards(AgencySessionGuard)
    @Delete(':notificationId')
    async delete(
        @Param('notificationId') notificationId: number,
    ): Promise<GenericResponse<null>> {
        await this.notificationsService.delete(notificationId);
        return new GenericResponse<null>(null);
    }

    @UseGuards(AgencySessionGuard)
    @Delete()
    async deleteAllByType(
        @Body('type') type: NotificationType,
    ): Promise<GenericResponse<null>> {
        await this.notificationsService.deleteByType(type);
        return new GenericResponse<null>(null);
    }
}
