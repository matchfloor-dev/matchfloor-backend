import { Column, Entity } from 'typeorm';

// entities
import { BaseEntity } from 'src/shared/entities/base.entity';
@Entity('clients')
export class Client extends BaseEntity {
    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 128, nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    email: string;
}
