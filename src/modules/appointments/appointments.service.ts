import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

//entities
import { Appointment } from './entities/appointment.entity';

//dto
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

//interfaces
import { CRUD } from 'src/shared/interfaces/crud.interface';

// services
import { AgenciesService } from '../agencies/agencies.service';
import { ClientsService } from '../agencies/modules/clients/clients.service';
import { AssignedResidencesService } from '../agents/modules/assigned-residences/assigned-residences.service';
import { MailsService } from '../mails/mails.service';
import { ResidencesService } from '../residences/residences.service';
import { AvailabilityService } from './availability.service';
import { NotificationsService } from './notifications.service';
import { AppointmentStatusHistoryService } from './appointmentStatusHistory.service';
import { AgencyNotificationsService } from '../agencies/modules/notifications/notifications.service';

// enum
import { AppointmentStatus } from './enum/appointment-status.enum';
import { NotificationType } from '../agencies/modules/notifications/enum/notification-type.enum';

@Injectable()
export class AppointmentsService implements CRUD<Appointment> {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentsRepository: Repository<Appointment>,
        private readonly assignedResidencesService: AssignedResidencesService,
        private readonly residencesService: ResidencesService,
        private readonly mailsService: MailsService,
        private readonly availabilityService: AvailabilityService,
        private readonly notificationsService: NotificationsService,
        private readonly clientsService: ClientsService,
        private readonly agenciesService: AgenciesService,
        private readonly statusHistoryService: AppointmentStatusHistoryService,
        private readonly jwtService: JwtService,
        private readonly agencyNotificationsService: AgencyNotificationsService,
    ) {}

    async create(
        createAppointmentDto: CreateAppointmentDto,
        residenceId: number,
        agencyId: number,
    ): Promise<Appointment> {
        // check if client exists
        let client = await this.clientsService.getByEmail(
            createAppointmentDto.email,
        );

        // if client does not exist, create a new one
        if (!client) {
            client = await this.clientsService.create({
                name: createAppointmentDto.name,
                email: createAppointmentDto.email,
                phone: createAppointmentDto.phone,
            });
        }

        // update client info
        client = await this.clientsService.update(client.id, {
            name: createAppointmentDto.name,
            phone: createAppointmentDto.phone,
        });

        // Add a 0 to the day if it's a single digit and add a 0 to the month if it's a single digit
        const dateParts = createAppointmentDto.date.split('-');
        if (dateParts[1].length === 1) {
            dateParts[1] = '0' + dateParts[1];
        }
        if (dateParts[2].length === 1) {
            dateParts[2] = '0' + dateParts[2];
        }
        createAppointmentDto.date = dateParts.join('-');

        // get available agents for the residence
        const availableAgents =
            await this.assignedResidencesService.findAvailableAgents(
                residenceId,
                createAppointmentDto.date,
                createAppointmentDto.hour,
                createAppointmentDto.duration,
            );

        if (!availableAgents.length) {
            throw new NotFoundException('ERR_NO_AVAILABLE_AGENTS');
        }

        const selectedAgent =
            availableAgents[Math.floor(Math.random() * availableAgents.length)];

        const residence = await this.residencesService.getById(
            residenceId,
            agencyId,
        );

        const agency = await this.agenciesService.getById(agencyId);

        console.log('residenceId', residenceId);
        console.log('agencyId', agencyId);
        console.log('date', createAppointmentDto.date);
        console.log('hour', createAppointmentDto.hour);
        console.log('duration', createAppointmentDto.duration);

        // check if the selected date is available
        const isAvailable = await this.checkAvailability(
            residenceId,
            agencyId,
            createAppointmentDto.date,
            createAppointmentDto.hour,
            createAppointmentDto.duration,
        );

        console.log('isAvailableeee', isAvailable);

        if (!isAvailable) {
            throw new NotFoundException('ERR_APPOINTMENT_NOT_AVAILABLE');
        }

        const newAppointment = await this.appointmentsRepository.save({
            ...createAppointmentDto,
            agentId: selectedAgent.id,
            residenceId,
            clientId: client.id,
            status: AppointmentStatus.PENDING,
        });

        await this.statusHistoryService.logStatusChange(
            newAppointment,
            AppointmentStatus.PENDING,
        );

        // create tokens for agent confirmation and cancellation
        const agentConfirmToken = await this.jwtService.sign(
            {
                appointmentId: newAppointment.id,
                type: 'agent-confirm',
                agencyId,
                residenceId,
                selectedAgent: selectedAgent.email,
            },
            { expiresIn: '1h' },
        );

        const agentCancelToken = await this.jwtService.sign(
            {
                appointmentId: newAppointment.id,
                type: 'agent-cancel',
                agencyId,
                residenceId,
                selectedAgent: selectedAgent.email,
            },
            { expiresIn: '1h' },
        );

        const rescheduleToken = await this.jwtService.sign({
            appointmentId: newAppointment.id,
            type: 'agent-reschedule',
            agencyId,
            residenceId,
            selectedAgent: selectedAgent.email,
        });
        // send email
        try {
            this.mailsService.sendMailNewAppoiment({
                agentMail: selectedAgent.email,
                agentName: selectedAgent.firstName,
                clientName: createAppointmentDto.name,
                clientMail: createAppointmentDto.email,
                phone: createAppointmentDto.phone,
                day: this.notificationsService.convertDate(
                    createAppointmentDto.date,
                ),
                hour: this.notificationsService.convertHour(
                    createAppointmentDto.hour,
                ),
                notes: createAppointmentDto.notes || '',
                residenceName: residence.name,
                agencyName: agency.name,
                agencyMail: agency.email,
                agentConfirmToken: agentConfirmToken,
                agentCancelToken: agentCancelToken,
                rescheduleToken,
            });

            this.mailsService.sendRecivedAppointment({
                agencyMail: agency.email,
                agencyName: agency.name,
                agentMail: selectedAgent.email,
                clientMail: createAppointmentDto.email,
                clientName: createAppointmentDto.name,
                day: this.notificationsService.convertDate(
                    createAppointmentDto.date,
                ),
                hour: this.notificationsService.convertHour(
                    createAppointmentDto.hour,
                ),
                residenceName: residence.name,
            });
        } catch (error) {
            throw new Error('ERR_SENDING_EMAIL');
        }

        const hour = this.notificationsService.convertHour(
            createAppointmentDto.hour,
        );

        // create notification for the agency
        await this.agencyNotificationsService.create({
            agencyId,
            title: '¡Nueva cita!',
            body: `Nueva cita en ${residence.name} el día ${createAppointmentDto.date} a las ${hour} horas.`,
            type: NotificationType.APPOINTMENT,
            appointmentId: newAppointment.id,
        });

        return newAppointment;
    }

    async getAll(residenceId: number): Promise<Appointment[]> {
        return await this.appointmentsRepository.find({
            where: { residenceId, isDeleted: false },
        });
    }

    async getById(id: number): Promise<Appointment> {
        return await this.appointmentsRepository.findOne({
            where: { id, isDeleted: false },
        });
    }

    async update(
        id: number,
        updateAppointmentDto: UpdateAppointmentDto,
    ): Promise<Appointment> {
        const appointment = await this.getById(id);

        if (!appointment) {
            throw new NotFoundException('ERR_APPOINTMENT_NOT_FOUND');
        }

        const updatedAppointment = {
            ...appointment,
            ...updateAppointmentDto,
            updatedAt: new Date(),
        };

        return await this.appointmentsRepository.save(
            updatedAppointment as Appointment,
        );
    }

    async updateRescheduleAppointment(
        token: string,
        day: string,
        hour: number,
    ) {
        const { appointmentId, agencyId, residenceId } = this.jwtService.verify(
            token,
        ) as any;

        if (!appointmentId) {
            throw new Error('ERR_INVALID_TOKEN');
        }

        const appointment = await this.getById(appointmentId);

        if (!appointment) {
            throw new NotFoundException('ERR_APPOINTMENT_NOT_FOUND');
        }

        appointment.date = day;
        appointment.hour = hour;

        await this.appointmentsRepository.save(appointment);

        const newToken = await this.jwtService.sign({
            appointmentId,
            agencyId,
            residenceId,
            type: 'agent-reschedule',
        });

        return await this.updateStatus(newToken);
    }

    async updateStatus(token: string): Promise<Appointment> {
        const { appointmentId, type, agencyId, residenceId } =
            this.jwtService.verify(token) as any;

        if (!appointmentId || !type) {
            throw new Error('ERR_INVALID_TOKEN');
        }

        const appointment = await this.getById(appointmentId);

        if (!appointment) {
            throw new NotFoundException('ERR_APPOINTMENT_NOT_FOUND');
        }

        const residence = await this.residencesService.getById(
            residenceId,
            agencyId,
        );

        const agency = await this.agenciesService.getById(agencyId);

        let newStatus: AppointmentStatus;

        switch (type) {
            case 'agent-confirm':
                if (appointment.status !== AppointmentStatus.PENDING) {
                    throw new BadRequestException(
                        'ERR_APPOINTMENT_ALREADY_CONFIRMED',
                    );
                }
                appointment.agentConfirmation = true;

                // Check if owner's email matches agency's email
                if (residence.ownerEmail === agency.email) {
                    // Auto-confirm the appointment since owner is the agency
                    appointment.ownerConfirmation = true;
                    newStatus = AppointmentStatus.PENDING_CLIENT;

                    await this.notificationsService.notifyAppointmentConfirmedByOwner(
                        agencyId,
                        appointment,
                        residence,
                    );

                    await this.notificationsService.createAppointmentReminder(
                        agencyId,
                        residenceId,
                        appointment,
                    );
                } else {
                    newStatus = AppointmentStatus.PENDING_OWNER;
                    await this.notificationsService.notifyOwnerOfAppointment(
                        agencyId,
                        appointment,
                        residence,
                    );
                }
                break;
            case 'agent-cancel':
                if (appointment.status !== AppointmentStatus.PENDING) {
                    throw new BadRequestException(
                        'ERR_APPOINTMENT_ALREADY_CANCELLED',
                    );
                }
                appointment.agentConfirmation = false;
                newStatus = AppointmentStatus.CANCELED;

                // Send the rejection email before deleting the appointment
                await this.notificationsService.notifyClientOfRejection(
                    agencyId,
                    appointment,
                    residenceId,
                );
                break;
            case 'agent-reschedule':
                if (appointment.status !== AppointmentStatus.PENDING) {
                    throw new BadRequestException(
                        'ERR_APPOINTMENT_ALREADY_REPROGRAMMED',
                    );
                }
                appointment.agentConfirmation = false;
                newStatus = AppointmentStatus.REPROGRAMMED;

                await this.notificationsService.notifyClientReschedule(
                    agencyId,
                    appointment,
                    residenceId,
                );
                break;
            case 'owner-confirm':
                if (appointment.status !== AppointmentStatus.PENDING_OWNER) {
                    throw new BadRequestException(
                        'ERR_APPOINTMENT_ALREADY_CONFIRMED',
                    );
                }
                appointment.ownerConfirmation = true;
                newStatus = AppointmentStatus.PENDING_CLIENT;

                await this.notificationsService.notifyAppointmentConfirmedByOwner(
                    agencyId,
                    appointment,
                    residence,
                );

                await this.notificationsService.createAppointmentReminder(
                    agencyId,
                    residenceId,
                    appointment,
                );
                break;
            case 'owner-cancel':
                if (appointment.status !== AppointmentStatus.PENDING_OWNER) {
                    throw new BadRequestException(
                        'ERR_APPOINTMENT_ALREADY_CANCELLED',
                    );
                }
                appointment.ownerConfirmation = false;
                newStatus = AppointmentStatus.CANCELED;

                await this.notificationsService.notifyCancellationByOwner(
                    agencyId,
                    appointment,
                    residence,
                );
                break;
            case 'client-confirm':
                if (appointment.status !== AppointmentStatus.PENDING_CLIENT) {
                    throw new BadRequestException(
                        'ERR_APPOINTMENT_ALREADY_ACCEPTED',
                    );
                }
                newStatus = AppointmentStatus.ACCEPTED;
                break;
            case 'client-cancel':
                if (appointment.status !== AppointmentStatus.PENDING_CLIENT) {
                    throw new BadRequestException(
                        'ERR_APPOINTMENT_ALREADY_REJECTED',
                    );
                }
                newStatus = AppointmentStatus.REJECTED;

                await this.notificationsService.notifyClientCancellation(
                    appointment,
                    residence,
                    agencyId,
                );
                break;
            case 'client-reschedule':
                if (appointment.status !== AppointmentStatus.REPROGRAMMED) {
                    throw new BadRequestException(
                        'ERR_APPOINTMENT_ALREADY_REPROGRAMMED',
                    );
                }
                appointment.agentConfirmation = true;
                newStatus = AppointmentStatus.PENDING_OWNER;

                await this.notificationsService.notifyOwnerOfAppointment(
                    agencyId,
                    appointment,
                    residence,
                );
                break;
            case 'client-cancel-reschedule':
                if (appointment.status !== AppointmentStatus.REPROGRAMMED) {
                    throw new BadRequestException(
                        'ERR_APPOINTMENT_ALREADY_CANCEL_REPROGRAMMED',
                    );
                }
                newStatus = AppointmentStatus.REJECTED;

                await this.notificationsService.notifyClientCancellationAPI(
                    appointment,
                    residence,
                    agencyId,
                );
                break;
            default:
                throw new BadRequestException('ERR_INVALID_CONFIRMATION_TYPE');
        }

        // Log the status change
        await this.statusHistoryService.logStatusChange(appointment, newStatus);

        // Update appointment status
        appointment.status = newStatus;
        return await this.appointmentsRepository.save(appointment);
    }

    async delete(id: number): Promise<void> {
        const appointment = await this.getById(id);

        if (!appointment) {
            throw new NotFoundException('ERR_APPOINTMENT_NOT_FOUND');
        }

        await this.appointmentsRepository.save({
            ...appointment,
            isDeleted: true,
        });
    }

    async checkAvailability(
        residenceId: number,
        agencyId: number,
        date: string,
        hour: number,
        duration: number,
    ): Promise<boolean> {
        // get available slots for the residence
        const availableSlots =
            await this.availabilityService.getResidenceAvailability(
                residenceId,
                agencyId,
            );

        console.log('availableSlots - checkAvailability', availableSlots);

        console.log('date - checkAvailability', date);

        console.log(
            'availableSlots.availability - checkAvailability',
            availableSlots.availability,
        );

        console.log('12-02-2025', availableSlots.availability['12-02-2025']);

        // convert date to dd-mm-yyyy format
        const dateParts = date.split('-');
        if (dateParts[1].length === 1) {
            dateParts[1] = '0' + dateParts[1];
        }
        date = dateParts.join('-');

        console.log('date formatted - checkAvailability', date);

        const dayAvailability = availableSlots.availability[date];

        console.log('dayAvailability - checkAvailability', dayAvailability);

        if (!dayAvailability) {
            console.log('No availability found for this date.');
            return false;
        }

        if (!duration) {
            duration = 1;
        }

        // check if the selected hour is available
        const selectedSlot = dayAvailability.find(
            (slot) =>
                slot.startTime === hour && slot.endTime === hour + duration,
        );

        console.log('selectedSlot - checkAvailability', selectedSlot);

        if (selectedSlot && !selectedSlot.booked) {
            return true;
        }

        return false;
    }

    async getAppointmentDetailsFromToken(token: string): Promise<{
        status: string;
        date: string;
        hour: string;
        residenceName: string;
        clientName: string;
    }> {
        const { appointmentId, agencyId } = this.jwtService.verify(
            token,
        ) as any;

        if (!appointmentId) {
            throw new Error('ERR_INVALID_TOKEN');
        }

        const appointment = await this.getById(appointmentId);

        if (!appointment) {
            throw new Error('ERR_APPOINTMENT_NOT_FOUND');
        }

        const date = appointment.date;
        const hour = this.notificationsService.convertHour(appointment.hour);
        const { residenceId, clientId } = appointment;

        const residence = await this.residencesService.getById(
            residenceId,
            agencyId,
        );
        const client = await this.clientsService.getById(clientId);

        return {
            date,
            hour,
            residenceName: residence?.name,
            clientName: client?.name,
            status: appointment?.status,
        };
    }

    async checkAppointmentsDate() {
        const statuses = [
            AppointmentStatus.REPROGRAMMED,
            AppointmentStatus.PENDING_OWNER,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.PENDING_CLIENT,
            AppointmentStatus.PENDING,
        ];

        const appointments = await this.appointmentsRepository.find({
            where: {
                status: In(statuses),
                isDeleted: false,
            },
            relations: ['residence', 'agent'],
        });

        const currentDate = new Date();

        for (const app of appointments) {
            let appointmentDate: Date;

            if (app.date.includes('T')) {
                appointmentDate = new Date(app.date);
            } else {
                const [datePart, timePart] = app.date.split(' ');
                const [day, month, year] = datePart.split('-').map(Number);
                const [hour, minute] = timePart
                    ? timePart.split(':').map(Number)
                    : [0, 0];

                appointmentDate = new Date(year, month - 1, day, hour, minute);
            }

            // Check if appointment date has passed
            if (appointmentDate < currentDate) {
                // If appointment was in PENDING status, cancel it
                if (app.status === AppointmentStatus.PENDING) {
                    app.status = AppointmentStatus.CANCELED;
                    await this.appointmentsRepository.save(app);
                    await this.statusHistoryService.logStatusChange(
                        app,
                        AppointmentStatus.CANCELED,
                    );

                    // Notify relevant parties about the automatic cancellation
                    await this.notificationsService.notifyClientOfRejection(
                        app.agent.agencyId,
                        app,
                        app.residenceId,
                    );
                }
                // For other statuses, keep the existing cancellation logic
                else if (app.status !== AppointmentStatus.CANCELED) {
                    app.status = AppointmentStatus.CANCELED;
                    await this.appointmentsRepository.save(app);
                    await this.statusHistoryService.logStatusChange(
                        app,
                        AppointmentStatus.CANCELED,
                    );
                }
            }
        }
    }
}
