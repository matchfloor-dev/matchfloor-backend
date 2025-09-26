import { Injectable, NotFoundException } from '@nestjs/common';

import { plainToInstance } from 'class-transformer';

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// entities
import { Notification } from './entities/notification.entity';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';

//enum
import { NotificationType } from './enum/notification-type.enum';

// dtos
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ReadNotificationDto } from './dto/read-notification.dto';

@Injectable()
export class AgencyNotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
    ) {}

    async create(
        createNotificationDto: CreateNotificationDto,
    ): Promise<Notification> {
        const notification = new Notification();
        notification.title = createNotificationDto.title;
        notification.body = createNotificationDto.body;
        notification.type = createNotificationDto.type;
        notification.agencyId = createNotificationDto.agencyId;
        notification.appointmentId = createNotificationDto.appointmentId;

        const savedNotification =
            await this.notificationRepository.save(notification);

        return this.notificationRepository.save(savedNotification);
    }

    async getById(id: number): Promise<ReadNotificationDto> {
        const notification = await this.notificationRepository.findOne({
            where: { id },
        });

        if (!notification) {
            throw new NotFoundException('ERR_NOTIFICATION_NOT_FOUND');
        }

        if (notification.appointmentId) {
            const appointment = await this.appointmentRepository.findOne({
                where: { id: notification.appointmentId },
                relations: ['client', 'residence', 'agent'],
            });

            const notificationData = {
                ...notification,
                id: notification.id.toString(),
                agencyId: notification.agencyId.toString(),
                appointment: {
                    date: appointment.date,
                    hour: appointment.hour,
                    duration: appointment.duration,
                    notes: appointment.notes,
                    clientName: appointment.client.name,
                    clientEmail: appointment.client.email,
                    clientPhone: appointment.client.phone,
                    residenceName: appointment.residence.name,
                    residenceOwnerEmail: appointment.residence.ownerEmail,
                    agentName:
                        appointment.agent.firstName +
                        ' ' +
                        appointment.agent.lastName,
                    agentEmail: appointment.agent.email,
                },
            };

            return plainToInstance(ReadNotificationDto, notificationData);
        }

        return plainToInstance(ReadNotificationDto, notification);
    }

    async getAll(agencyId: number): Promise<ReadNotificationDto[]> {
        const notifications = await this.notificationRepository.find({
            where: { agencyId, isDeleted: false },
        });

        const notificationsData = await Promise.all(
            notifications.map(async (notification) => {
                if (notification.appointmentId) {
                    const appointment =
                        await this.appointmentRepository.findOne({
                            where: { id: notification.appointmentId },
                            relations: ['client', 'residence', 'agent'],
                        });

                    return {
                        ...notification,
                        id: notification.id.toString(),
                        agencyId: notification.agencyId.toString(),
                        appointment: {
                            date: appointment.date,
                            hour: appointment.hour,
                            duration: appointment.duration,
                            notes: appointment.notes,
                            clientName: appointment.client.name,
                            clientEmail: appointment.client.email,
                            clientPhone: appointment.client.phone,
                            residenceName: appointment.residence.name,
                            residenceOwnerEmail:
                                appointment.residence.ownerEmail,
                            agentName:
                                appointment.agent.firstName +
                                ' ' +
                                appointment.agent.lastName,
                            agentEmail: appointment.agent.email,
                        },
                    };
                }

                return {
                    ...notification,
                    id: notification.id.toString(),
                    agencyId: notification.agencyId.toString(),
                };
            }),
        );

        return plainToInstance(ReadNotificationDto, notificationsData);
    }

    async update(): Promise<Notification> {
        throw new Error('Method not implemented.');
    }

    async delete(id: number): Promise<void> {
        const notification = await this.notificationRepository.findOne({
            where: { id },
        });

        if (!notification) {
            throw new NotFoundException('ERR_NOTIFICATION_NOT_FOUND');
        }

        await this.notificationRepository.save({
            ...notification,
            isDeleted: true,
        });
    }

    async deleteByType(type: NotificationType): Promise<void> {
        const notifications = await this.notificationRepository.find({
            where: { type },
        });

        await Promise.all(
            notifications.map(async (notification) => {
                await this.notificationRepository.save({
                    ...notification,
                    isDeleted: true,
                });
            }),
        );
    }
}
