// import { Column, CreateDateColumn, Entity, ManyToOne, Unique } from 'typeorm';

// // entities
// import { Agency } from 'src/modules/agencies/entities/agency.entity';
// import { BaseEntity } from 'src/shared/entities/base.entity';

// // enums
// import { Langs } from 'src/shared/enum/languages.enum';

// @Entity()
// @Unique(['case', 'agencyId'])
// export class EmailTemplate extends BaseEntity {
//     @Column({ type: 'varchar', length: 64, nullable: false })
//     case: string;

//     @Column({ type: 'varchar', length: 255, nullable: false })
//     subject: string;

//     @Column({ type: 'text', nullable: false })
//     message: string;

//     @ManyToOne(() => Agency, (agency) => agency.emailTemplates)
//     agency: Agency;

//     @Column({ type: 'int', nullable: false })
//     agencyId: number;

//     @Column({ type: 'json', nullable: true, default: null })
//     variables: any;

//     @Column({ type: 'varchar', length: 2, default: 'en' })
//     lang: Langs;

//     @Column({ type: 'text', nullable: true, default: null })
//     html: string;

//     @CreateDateColumn()
//     createdAt: Date;
// }
