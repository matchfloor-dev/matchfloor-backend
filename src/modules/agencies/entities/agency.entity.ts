import { Column, Entity, OneToMany, OneToOne, ManyToOne } from 'typeorm';

// entities
import { BaseEntity } from 'src/shared/entities/base.entity';
import { Agent } from 'src/modules/agents/entities/agent.entity';
import { WorkingDays } from '../modules/working-days/entities/working-day.entity';
import { Configuration } from '../modules/configuration/entities/configuration.entity';
// import { EmailTemplate } from 'src/modules/email-templates/entities/email-template.entity';
import { Subscription } from 'src/modules/subscriptions/entities/subscriptions.entity';
import { Notification } from 'src/modules/agencies/modules/notifications/entities/notification.entity';
import { Prescriptor } from 'src/modules/prescriptors/entities/prescriptor.entity';

@Entity('agencies')
export class Agency extends BaseEntity {
    @Column({ type: 'varchar', length: 128, nullable: false })
    name: string;

    @Column({ type: 'varchar', nullable: true })
    address: string;

    @Column({ type: 'varchar', length: 128, nullable: true })
    phone: string;

    @Column({ type: 'varchar', nullable: true })
    website: string;

    @Column({ type: 'varchar', unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', nullable: false })
    password: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'boolean', default: false })
    isSubscriptionActive: boolean;

    @Column({ type: 'boolean', default: false })
    usedFreeTrial: boolean;

    @OneToMany(() => Agent, (agent) => agent.agency)
    agents: Agent[];

    // api keys
    @Column({ type: 'varchar', length: 255, nullable: true })
    adminKey: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    widgetKey: string;

    // Reset password
    @Column({ type: 'varchar', length: 255, nullable: true })
    resetPasswordToken: string;

    @Column({ type: 'bigint', nullable: true })
    resetPasswordExpires: number;

    @Column({ type: 'bigint', nullable: true })
    passwordResetedAt: number;

    @Column({ type: 'int', nullable: true })
    verificationCode: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    stripeCustomerId: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    stripePaymentMethodId: string;

    // Working days
    @OneToMany(() => WorkingDays, (workingDays) => workingDays.agency)
    workingDays: WorkingDays[];

    // Subscriptions
    @OneToMany(() => Subscription, (subscription) => subscription.agency)
    subscriptions: Subscription[];

    // Configuration
    @OneToOne(() => Configuration, (configuration) => configuration.agency)
    configuration: Configuration;

    // Email templates
    // @OneToMany(() => EmailTemplate, (emailTemplate) => emailTemplate.agency)
    // emailTemplates: EmailTemplate[];

    // Notifications
    @OneToMany(() => Notification, (notification) => notification.agency)
    notifications: Notification[];

    @Column({ type: 'varchar', length: 10, nullable: true })
    prescriptorReferenceCode: string;

    @ManyToOne(() => Prescriptor, (prescriptor) => prescriptor.referredAgencies, {
        nullable: true,
    })
    prescriptor: Prescriptor;
}
