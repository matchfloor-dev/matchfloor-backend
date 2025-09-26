import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

// services
import { AgenciesService } from '../agencies/agencies.service';
import { MailsService } from '../mails/mails.service';
import { ResidencesService } from '../residences/residences.service';
import { AgentsService } from '../agents/agents.service';

// entities
import { Reminder } from './entities/reminder.entity';

// dto
import { CreateReminderDto } from './dto/create-reminder.dto';
import { EmailDispatchConfigDto } from './dto/email-dispatch-config.dto';

@Injectable()
export class RemindersService {
    constructor(
        @InjectRepository(Reminder)
        private readonly reminderRepository: Repository<Reminder>,

        private readonly mailsService: MailsService,
        private readonly residenceService: ResidencesService,
        private readonly agencyService: AgenciesService,
        private readonly agentService: AgentsService,
    ) {}

    async findExpiredReminders(): Promise<Reminder[]> {
        return this.reminderRepository.find({
            where: {
                dueDate: LessThan(new Date()),
                isCompleted: false,
            },
        });
    }

    async createReminder(reminderDto: CreateReminderDto): Promise<Reminder> {
        const reminder = this.reminderRepository.create(reminderDto);
        return this.reminderRepository.save(reminder);
    }

    async dispatchEmail(
        reminderId: number,
        config: EmailDispatchConfigDto,
    ): Promise<void> {
        // 1) Get the data from config
        const {
            clientName,
            clientMail,
            day,
            hour,
            agencyId,
            residenceId,
            agentId,
            clientConfirmToken,
            clientCancelToken,
        } = config;

        try {
            // 2) Get the residence data
            const residence = await this.residenceService.getById(
                residenceId,
                agencyId,
            );

            console.log('Residence:?', !!residence);

            // 3) Get the agency data
            const agency = await this.agencyService.getById(agencyId);

            console.log('Agency:?', !!agency);

            if (!residence) {
                throw new NotFoundException('Appoiment not found');
            }

            // 4) Get the agent data
            const agent = await this.agentService.getById(agentId);

            console.log('Agent:?', !!agent);

            if (!agent) {
                throw new NotFoundException('Agent not found');
            }

            // 6) Send the email
            await this.mailsService.sendReminderAppointment({
                clientName,
                clientMail,
                agentMail: agent.email,
                residenceName: residence.name,
                day,
                hour,
                agencyName: agency.name,
                agencyMail: agency.email,
                clientConfirmToken,
                clientCancelToken,
            });

            await this.mailsService.sendReminderAgentOwner({
                agentName: agent.firstName,
                ownerName: 'Propietario/a',
                clientName,
                day,
                hour,
                residenceName: residence.name,
                agencyName: agency.name,
                agencyMail: agency.email,
                ownerMail: residence.ownerEmail,
                agentMail: agent.email,
            });

            // 5) Delete the reminder
            await this.reminderRepository.delete(reminderId);
        } catch (error) {
            console.error('Error dispatching email:', error);
        }
    }
}
