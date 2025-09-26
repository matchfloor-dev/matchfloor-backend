import { Entity, Column, ManyToOne } from 'typeorm';

// entities
import { Appointment } from './appointment.entity';
import { BaseEntity } from 'src/shared/entities/base.entity';

// enums
import { AppointmentStatus } from '../enum/appointment-status.enum';

@Entity('appointment_status_history')
export class AppointmentStatusHistory extends BaseEntity {
    @Column({
        type: 'enum',
        enum: AppointmentStatus,
    })
    status: AppointmentStatus;

    @ManyToOne(() => Appointment, (appointment) => appointment.statusHistory, {
        onDelete: 'CASCADE',
    })
    appointment: Appointment;
}
