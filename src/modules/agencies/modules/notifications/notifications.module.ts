import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// services
import { AgencyNotificationsService } from './notifications.service';

// controllers
import { NotificationsController } from './notifications.controller';

// entities
import { Notification } from './entities/notification.entity';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Notification, Appointment])],
    controllers: [NotificationsController],
    providers: [AgencyNotificationsService],
    exports: [AgencyNotificationsService],
})
export class NotificationsModule {}
