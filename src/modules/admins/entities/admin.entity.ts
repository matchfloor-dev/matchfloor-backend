import { Entity, Column } from 'typeorm';

// entities
import { BaseEntity } from 'src/shared/entities/base.entity';

@Entity('admins')
export class Admin extends BaseEntity {
    @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', nullable: false })
    password: string;

    @Column({ type: 'varchar', length: 255 })
    firstName: string;

    @Column({ type: 'varchar', length: 255 })
    lastName: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'boolean', default: false })
    isSuperAdmin: boolean;
}
