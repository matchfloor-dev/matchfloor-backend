import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/shared/entities/base.entity';
import { Agency } from 'src/modules/agencies/entities/agency.entity';

@Entity('prescriptors')
@Index(['email', 'isDeleted'], { unique: true })
export class Prescriptor extends BaseEntity {
    @Column({ type: 'varchar', length: 255, nullable: false })
    email: string;

    @Column({ type: 'varchar', nullable: false })
    password: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    firstName: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    lastName: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phoneNumber: string;

    @Column({ type: 'varchar', length: 10, nullable: false, unique: true })
    referenceCode: string;

    @Column({ type: 'boolean', default: false })
    isVerified: boolean;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    // Email verification
    @Column({ type: 'varchar', length: 6, nullable: true })
    verificationCode: string;

    @Column({ type: 'bigint', nullable: true })
    verificationCodeExpires: number;

    // Referred agencies
    @OneToMany(() => Agency, (agency) => agency.prescriptor)
    referredAgencies: Agency[];
} 