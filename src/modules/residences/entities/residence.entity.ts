import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';

// entities
import { BaseEntity } from 'src/shared/entities/base.entity';
import { Agent } from 'src/modules/agents/entities/agent.entity';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { ResidencesSources } from '../enum/residence-sources.enum';

@Entity('residences')
export class Residence extends BaseEntity {
    @Column({ type: 'text', nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    ownerEmail: string;

    @ManyToMany(() => Agent, (agent) => agent.residences)
    agents: Agent[];

    @Column({ type: 'boolean', default: false })
    allAgents: boolean;

    @Column({ type: 'enum', enum: ResidencesSources, default: ResidencesSources.MANUAL })
    source: ResidencesSources;

    @Column({ type: 'simple-array', nullable: true })
    identifiers?: string[];

    @OneToMany(() => Appointment, (appointment) => appointment.residence)
    appointments: Appointment[];
}
