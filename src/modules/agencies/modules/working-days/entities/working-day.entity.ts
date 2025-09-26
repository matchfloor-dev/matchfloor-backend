import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

// entities
import { BaseEntity } from 'src/shared/entities/base.entity';
import { Agency } from 'src/modules/agencies/entities/agency.entity';
import { WorkingTimeSlot } from './working-time-slot.entity';

// enums
import { Days } from 'src/shared/enum/days.enum';

@Entity('agency_working_days')
export class WorkingDays extends BaseEntity {
    @Column({ type: 'enum', enum: Days, default: Days.MONDAY, nullable: false })
    day: Days;

    @OneToMany(() => WorkingTimeSlot, (timeSlot) => timeSlot.workingDay, {
        cascade: true,
    })
    timeSlots: WorkingTimeSlot[];

    @Column({ type: 'boolean', nullable: false, default: false })
    isOffDay: boolean;

    @ManyToOne(() => Agency, (agency) => agency.workingDays)
    agency: Agency;

    @Column({ type: 'int', nullable: false })
    agencyId: number;
}
