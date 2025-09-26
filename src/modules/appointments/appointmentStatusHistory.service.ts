import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// entities
import { AppointmentStatusHistory } from './entities/appointmentStatusHistory.entity';
import { Appointment } from './entities/appointment.entity';

// enums
import { AppointmentStatus } from './enum/appointment-status.enum';

@Injectable()
export class AppointmentStatusHistoryService {
    constructor(
        @InjectRepository(AppointmentStatusHistory)
        private statusHistoryRepo: Repository<AppointmentStatusHistory>,
    ) {}

    async logStatusChange(
        appointment: Appointment,
        newStatus: AppointmentStatus,
    ) {
        const statusHistory = new AppointmentStatusHistory();
        statusHistory.appointment = appointment;
        statusHistory.status = newStatus;
        statusHistory.createdAt = new Date();
        await this.statusHistoryRepo.save(statusHistory);
    }

    async getAppointmentStatusHistory(appointment: Appointment) {
        const statusHistory = await this.statusHistoryRepo.find({
            where: { appointment: { id: appointment.id } }, // Query by the appointment relation
            order: { createdAt: 'DESC' },
        });
        return statusHistory;
    }
}
