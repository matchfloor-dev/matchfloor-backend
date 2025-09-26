import { BaseEntity } from 'src/shared/entities/base.entity';
import {
    Column,
    Entity,
} from 'typeorm';
import { JobTypes } from '../enums/job-types.enum';

@Entity()
export class Job extends BaseEntity {
    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ type: 'enum', enum: JobTypes, nullable: false })
    case: JobTypes;

    @Column({ type: 'json', nullable: false })
    config: any;

    @Column({ type: 'bigint', nullable: false})
    dueDate: number;

    @Column({ type: 'boolean', nullable: false, default: false })
    isCompleted: boolean;
}
