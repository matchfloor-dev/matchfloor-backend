import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/shared/entities/base.entity';
import { WorkingDays } from './working-day.entity';

@Entity('agency_working_time_slots')
export class WorkingTimeSlot extends BaseEntity {
    @Column({ type: 'double', nullable: false })
    startTime: number;

    @Column({ type: 'double', nullable: false })
    endTime: number;

    @ManyToOne(() => WorkingDays, (workingDays) => workingDays.timeSlots)
    workingDay: WorkingDays;

    @Column({ type: 'int', nullable: false })
    workingDayId: number;
}
