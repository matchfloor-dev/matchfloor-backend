import {
    Column,
    Entity,
    Index,
    OneToMany,
    ManyToOne,
    ManyToMany,
    JoinTable,
} from 'typeorm';

// entities
import { BaseEntity } from 'src/shared/entities/base.entity';
import { Agency } from 'src/modules/agencies/entities/agency.entity';
import { WorkingDays } from '../modules/working-days/entities/working-day.entity';
import { Residence } from 'src/modules/residences/entities/residence.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('agents')
@Index(['email', 'isDeleted'], { unique: true })
export class Agent extends BaseEntity {
    @Column({ type: 'varchar', length: 255, nullable: false })
    email: string;

    @Column({ type: 'varchar', nullable: false })
    password: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    firstName: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    lastName: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'boolean', default: false })
    isOwner: boolean;

    @ManyToOne(() => Agency, (agency) => agency.agents)
    agency: Agency;

    @Column({ type: 'int', nullable: false })
    agencyId: number;

    @OneToMany(() => WorkingDays, (workingDays) => workingDays.agent)
    workingDays: WorkingDays[];

    @ManyToMany(() => Residence, (residence) => residence.agents)
    @JoinTable({
        name: 'agents_residences',
        joinColumn: { name: 'agentId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'residenceId', referencedColumnName: 'id' },
    })
    residences: Residence[];

    @Column({ type: 'boolean', default: false })
    allResidences: boolean;

    @OneToMany(() => Appointment, (appointment) => appointment.agent)
    appointments: Appointment[];

    // Reset password
    @Column({ type: 'varchar', length: 255, nullable: true })
    resetPasswordToken: string;

    @Column({ type: 'bigint', nullable: true })
    resetPasswordExpires: number;

    @Column({ type: 'bigint', nullable: true })
    passwordResetedAt: number;
}
