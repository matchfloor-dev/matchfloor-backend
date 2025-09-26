import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { Agency } from '../../../entities/agency.entity';

@Entity('configuration')
export class Configuration {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    logoUrl: string;

    @Column({ nullable: true })
    primaryColor: string;

    @Column({ nullable: true })
    secondaryColor: string;

    @Column({ default: 31 })
    maxScheduleDays: number;

    @Column({ default: 1 })
    minScheduleDays: number;

    @OneToOne(() => Agency, (agency) => agency.configuration)
    agency: Agency;

    @Column({ type: 'int', nullable: false })
    agencyId: number;
}
