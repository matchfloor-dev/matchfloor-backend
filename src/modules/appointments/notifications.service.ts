import { parse, subDays } from 'date-fns';
import { JwtService } from '@nestjs/jwt';

import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// entities
import { Appointment } from './entities/appointment.entity';
import { Residence } from '../residences/entities/residence.entity';

// enum
import { EmailDispatchConfigDto } from '../reminders/dto/email-dispatch-config.dto';
import { ReminderTypes } from '../reminders/enum/reminder-types.enum';

// services
import { AgenciesService } from '../agencies/agencies.service';
import { ClientsService } from '../agencies/modules/clients/clients.service';
import { AgentsService } from '../agents/agents.service';
import { MailsService } from '../mails/mails.service';
import { RemindersService } from '../reminders/reminders.service';
import { ResidencesService } from '../residences/residences.service';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Appointment)
        private appointmentsRepository: Repository<Appointment>,
        private readonly jwtService: JwtService,
        private readonly mailsService: MailsService,
        private readonly agenciesService: AgenciesService,
        private readonly clientsService: ClientsService,
        private readonly residencesService: ResidencesService,
        private readonly agentsService: AgentsService,
        private readonly remindersService: RemindersService,
    ) {}

    async notifyOwnerOfAppointment(
        agencyId: number,
        appointment: Appointment,
        residence: Residence,
    ) {
        const ownerEmail = residence.ownerEmail;
        const agent = await this.agentsService.getById(appointment.agentId);

        const ownerConfirmToken = await this.jwtService.sign(
            {
                appointmentId: appointment.id,
                type: 'owner-confirm',
                agencyId: agencyId,
                residenceId: residence.id,
                selectedAgent: appointment.agentId,
            },
            { expiresIn: '1h' },
        );

        const ownerCancelToken = await this.jwtService.sign(
            {
                appointmentId: appointment.id,
                type: 'owner-cancel',
                agencyId: agencyId,
                residenceId: residence.id,
                selectedAgent: appointment.agentId,
            },
            { expiresIn: '1h' },
        );

        const agency = await this.agenciesService.getById(agencyId);

        try {
            await this.mailsService.sendMailOwnerConfirmation({
                ownerMail: ownerEmail,
                agencyName: agency.name,
                agencyMail: agency.email,
                agentMail: agent.email,
                day: this.convertDate(appointment.date),
                hour: this.convertHour(appointment.hour),
                residenceName: residence.name,
                ownerConfirmToken: ownerConfirmToken,
                ownerCancelToken: ownerCancelToken,
            });
        } catch (error) {
            throw new Error('ERR_SENDING_OWNER_EMAIL');
        }
    }

    async notifyClientOfRejection(
        agencyId: number,
        appointment: Appointment,
        residenceId: number,
    ) {
        const agency = await this.agenciesService.getById(agencyId);
        const client = await this.clientsService.getById(appointment.clientId);
        const residence = await this.residencesService.getById(
            residenceId,
            agencyId,
        );
        const agent = await this.agentsService.getById(appointment.agentId);

        try {
            await this.mailsService.sendRejectedMailClient({
                clientMail: client.email,
                clientName: client.name,
                agentMail: agent.email,
                day: this.convertDate(appointment.date),
                hour: this.convertHour(appointment.hour),
                residenceName: residence.name,
                agencyName: agency.name,
                agencyMail: agency.email,
            });
        } catch (error) {
            throw new Error('ERR_SENDING_REJECTION_EMAIL');
        }
    }

    async notifyClientReschedule(
        agencyId: number,
        appointment: Appointment,
        ressideceId: number,
    ) {
        const agency = await this.agenciesService.getById(agencyId);
        const client = await this.clientsService.getById(appointment.clientId);
        const residence = await this.residencesService.getById(
            ressideceId,
            agencyId,
        );
        const agent = await this.agentsService.getById(appointment.agentId);

        const clientConfirmToken = await this.jwtService.sign({
            appointmentId: appointment.id,
            type: 'client-reschedule',
            agencyId: agencyId,
            residenceId: residence.id,
            selectedAgent: appointment.agentId,
        });

        const clientCancelToken = await this.jwtService.sign({
            appointmentId: appointment.id,
            type: 'client-cancel-reschedule',
            agencyId: agencyId,
            residenceId: residence.id,
            selectedAgent: appointment.agentId,
        });

        try {
            await this.mailsService.sendRescheduleMailClient({
                clientMail: client.email,
                clientName: client.name,
                agentMail: agent.email,
                day: this.convertDate(appointment.date),
                hour: this.convertHour(appointment.hour),
                residenceName: residence.name,
                agencyName: agency.name,
                agencyMail: agency.email,
                clientConfirmToken,
                clientCancelToken,
            });
        } catch (error) {
            throw new Error('ERR_SENDING_CLIENT_RESCHEDULE');
        }
    }

    async notifyCancellationByOwner(
        agencyId: number,
        appointment: Appointment,
        residence: Residence,
    ) {
        const agent = await this.agentsService.getById(appointment.agentId);
        const agency = await this.agenciesService.getById(agencyId);
        const client = await this.clientsService.getById(appointment.clientId);

        try {
            await this.mailsService.sendCancelOwnerAppointment({
                clientMail: client.email,
                clientName: client.name,
                agentMail: agent.email,
                agentName: agent.firstName,
                day: this.convertDate(appointment.date),
                hour: this.convertHour(appointment.hour),
                residenceName: residence.name,
                agencyName: agency.name,
                agencyMail: agency.email,
            });
        } catch (error) {
            throw new Error('ERR_SENDING_CANCELLATION_BY_OWNER');
        }
    }

    async notifyAppointmentConfirmedByOwner(
        agencyId: number,
        appointment: Appointment,
        residence: Residence,
    ) {
        const agent = await this.agentsService.getById(appointment.agentId);
        const agency = await this.agenciesService.getById(agencyId);
        const client = await this.clientsService.getById(appointment.clientId);

        try {
            await this.mailsService.sendAppointmentAccepted({
                clientName: client.name,
                clientMail: client.email,
                agentName: agent.firstName,
                agentMail: agent.email,
                day: this.convertDate(appointment.date),
                hour: this.convertHour(appointment.hour),
                residenceName: residence.name,
                agencyName: agency.name,
                agencyMail: agency.email,
            });
        } catch (error) {
            throw new Error('ERR_SENDING_APPOINTMENT_CONFIRMATION_BY_OWNER');
        }
    }

    async notifyClientCancellation(
        appointment: Appointment,
        residence: Residence,
        agencyId: number,
    ) {
        const ownerEmail = residence.ownerEmail;
        const agent = await this.agentsService.getById(appointment.agentId);
        const agency = await this.agenciesService.getById(agencyId);
        const client = await this.clientsService.getById(appointment.clientId);

        try {
            await this.mailsService.sendClientCancellationEmail({
                agentMail: agent.email,
                agentName: agent.firstName,
                ownerMail: ownerEmail,
                clientName: client.name,
                day: this.convertDate(appointment.date),
                hour: this.convertHour(appointment.hour),
                residenceName: residence.name,
                agencyName: agency.name,
                agencyMail: agency.email,
            });
        } catch (error) {
            throw new Error('ERR_SENDING_CLIENT_CANCELLATION');
        }
    }

    async notifyClientCancellationAPI(
        appointment: Appointment,
        residence: Residence,
        agencyId: number,
    ) {
        const agent = await this.agentsService.getById(appointment.agentId);
        const agency = await this.agenciesService.getById(agencyId);
        const client = await this.clientsService.getById(appointment.clientId);

        try {
            await this.mailsService.sendClientRescheduleCancellationEmail({
                agentMail: agent.email,
                agentName: agent.firstName,
                clientName: client.name,
                day: this.convertDate(appointment.date),
                hour: this.convertHour(appointment.hour),
                residenceName: residence.name,
                agencyName: agency.name,
                agencyMail: agency.email,
            });
        } catch (error) {
            throw new Error('ERR_SENDING_CLIENT_CANCELLATION_API');
        }
    }

    async createAppointmentReminder(
        agencyId: number,
        residenceId: number,
        appointment: Appointment,
    ) {
        const client = await this.clientsService.getById(appointment.clientId);
        const residence = await this.residencesService.getById(
            residenceId,
            agencyId,
        );

        const dueDate = subDays(
            parse(appointment.date, 'dd-MM-yyyy', new Date()),
            1,
        );

        const clientConfirmToken = await this.jwtService.sign(
            {
                appointmentId: appointment.id,
                type: 'client-confirm',
                agencyId: agencyId,
                residenceId: residence.id,
                selectedAgent: appointment.agentId,
            },
            { expiresIn: '1h' },
        );

        const clientCancelToken = await this.jwtService.sign(
            {
                appointmentId: appointment.id,
                type: 'client-cancel',
                agencyId: agencyId,
                residenceId: residence.id,
                selectedAgent: appointment.agentId,
            },
            { expiresIn: '1h' },
        );

        const config: EmailDispatchConfigDto = {
            clientName: client.name,
            clientMail: client.email,
            day: this.convertDate(appointment.date),
            hour: this.convertHour(appointment.hour),
            residenceId: residence.id,
            agencyId,
            agentId: appointment.agentId,
            clientConfirmToken,
            clientCancelToken,
        };

        console.log('Reminder config:', config);

        // create a reminder for the client
        const sendthereminder = await this.remindersService.createReminder({
            name: 'Appointment Confirmation Reminder',
            case: ReminderTypes.DISTPATCH_EMAIL,
            config,
            dueDate,
        });

        console.log('Reminder created:', sendthereminder);
    }

    convertDate(inputDate) {
        // Split the input date (dd-mm-yyyy)
        const [day, month, year] = inputDate.split('-');

        const months = [
            'Enero',
            'Febrero',
            'Marzo',
            'Abril',
            'Mayo',
            'Junio',
            'Julio',
            'Agosto',
            'Septiembre',
            'Octubre',
            'Noviembre',
            'Diciembre',
        ];

        const monthName = months[parseInt(month) - 1];

        // Return the formatted date
        return `${day} de ${monthName} de ${year}`;
    }

    convertHour(hour: number) {
        const hours = Math.floor(hour);
        const minutes = Math.round((hour % 1) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
}
