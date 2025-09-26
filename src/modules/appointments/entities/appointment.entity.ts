import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

// entities
import { Client } from 'src/modules/agencies/modules/clients/entities/client.entity';
import { Agent } from 'src/modules/agents/entities/agent.entity';
import { Residence } from 'src/modules/residences/entities/residence.entity';
import { AppointmentStatusHistory } from './appointmentStatusHistory.entity';
import { BaseEntity } from 'src/shared/entities/base.entity';

// enums
import { AppointmentStatus } from '../enum/appointment-status.enum';

@Entity('appointments')
export class Appointment extends BaseEntity {
    @Column({ type: 'varchar', nullable: false })
    date: string;

    @Column({ type: 'double', nullable: false })
    hour: number;

    @Column({ type: 'int', nullable: false, default: 1 })
    duration: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @ManyToOne(() => Client, (client) => client)
    client: Client;

    @Column({ type: 'int', nullable: false })
    clientId: number;

    @Column({ type: 'int', nullable: false })
    agentId: number;

    @ManyToOne(() => Agent, (agent) => agent.appointments)
    agent: Agent;

    @Column({ type: 'int', nullable: false })
    residenceId: number;

    @ManyToOne(() => Residence, (residence) => residence.appointments)
    residence: Residence;

    @Column({ type: 'boolean', default: false })
    ownerConfirmation: boolean;

    @Column({ type: 'boolean', default: false })
    agentConfirmation: boolean;

    @Column({
        type: 'enum',
        enum: AppointmentStatus,
        default: AppointmentStatus.PENDING,
    })
    status: AppointmentStatus;

    @OneToMany(
        () => AppointmentStatusHistory,
        (statusHistory) => statusHistory.appointment,
    )
    statusHistory: AppointmentStatusHistory[];
}
