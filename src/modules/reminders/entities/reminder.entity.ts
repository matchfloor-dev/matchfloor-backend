import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Reminder {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 127, nullable: false })
    case: string;

    @Column({ type: 'json', nullable: false, default: null })
    config: any;

    @Column({ type: 'datetime', nullable: true, default: null })
    dueDate: Date;

    @Column({ type: 'boolean', nullable: false, default: false })
    isCompleted: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
