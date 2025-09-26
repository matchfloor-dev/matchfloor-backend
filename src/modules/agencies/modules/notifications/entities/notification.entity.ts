import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/shared/entities/base.entity';
import { Agency } from 'src/modules/agencies/entities/agency.entity';
import { NotificationType } from '../enum/notification-type.enum';

@Entity('notifications')
export class Notification extends BaseEntity {
    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    body: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @ManyToOne(() => Agency, (agency) => agency.notifications)
    agency: Agency;

    @Column({ type: 'int' })
    agencyId: number;

    @Column({ type: 'int', nullable: true })
    appointmentId: number;
}
