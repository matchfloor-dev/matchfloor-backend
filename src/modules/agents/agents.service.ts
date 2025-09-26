import {
    BadGatewayException,
    BadRequestException,
    Injectable,
    Inject,
    forwardRef,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';

// services
import { JwtService } from '@nestjs/jwt';
import { MailsService } from '../mails/mails.service';
import { AppointmentStatusHistoryService } from '../appointments/appointmentStatusHistory.service';
import { AgentWorkingDaysService } from './modules/working-days/working-days.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ResidencesService } from '../residences/residences.service';

// entities
import { Agent } from './entities/agent.entity';
import { Residence } from '../residences/entities/residence.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Client } from '../agencies/modules/clients/entities/client.entity';

// dto
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { HomeSearchItemDto } from 'src/shared/dto/home-search-item.dto';
import { ForgotPasswordDto } from '../auth/dto/forgot-password.dto';
import {
    ReadCalendarAppointmentDto,
    CalendarAppointmentDto,
} from './dto/read-calendar-appointment.dto';
import { ResetPasswordDto } from '../auth/dto/reset-password.dto';
import { ReadOwnerDto } from '../agencies/dto/read-owner.dto';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';

// interfaces
import { CRUD } from 'src/shared/interfaces/crud.interface';

// config
import { envs } from 'src/config/envs.config';
import { ReadAgentForAgencyDto } from './dto/read-agent-for-agency.dto';
import { plainToClass } from 'class-transformer';

const BASEURL = `${envs.FRONTEND_URL}/mails/appointments`;

@Injectable()
export class AgentsService implements CRUD<Agent> {
    constructor(
        @InjectRepository(Agent)
        private readonly agentsRepository: Repository<Agent>,
        @InjectRepository(Residence)
        private readonly residencesRepository: Repository<Residence>,
        @InjectRepository(Client)
        private readonly clientsRepository: Repository<Client>,

        private readonly jwtService: JwtService,
        private readonly mailsService: MailsService,
        private readonly statusHistoryService: AppointmentStatusHistoryService,
        @Inject(forwardRef(() => AgentWorkingDaysService))
        private readonly workingDaysService: AgentWorkingDaysService,
        private readonly subscriptionsService: SubscriptionsService,
        private readonly residencesService: ResidencesService,
    ) {}

    async create(
        createAgentDto: CreateAgentDto,
        agencyId: number,
    ): Promise<Agent> {
        // Validate that the agency can create agents
        const canAddAgent =
            await this.subscriptionsService.canAddAgent(agencyId);

        if (!canAddAgent) {
            throw new BadRequestException('ERR_AGENCY_NO_AGENT_SLOTS');
        }

        if (createAgentDto.password !== createAgentDto.passwordConfirmation) {
            throw new BadGatewayException('ERR_PASSWORDS_NOT_MATCH');
        }

        const password = await bcrypt.hash(createAgentDto.password, 10);
        const { email } = createAgentDto;

        const agentExists = await this.agentsRepository.findOne({
            where: { email, isDeleted: false },
        });

        if (agentExists) {
            throw new BadGatewayException('ERR_EMAIL_ALREADY_EXISTS');
        }

        const { residencesIds, ...agentData } = createAgentDto;
        let residences = [];

        const allAgentsResidences =
            await this.residencesService.getByAllAgentsTrue(agencyId);

        // add the allResidences ids to the residencesIds array
        if (allAgentsResidences) {
            const allResidencesIds = allAgentsResidences.map(
                (residence) => residence.id,
            );

            if (residencesIds) {
                residencesIds.push(...allResidencesIds);
            }
        }

        if (createAgentDto.allResidences) {
            residences = await this.residencesRepository.find({
                where: { isDeleted: false },
                relations: ['agents'],
            });

            residences = residences.filter((residence) =>
                residence.agents.some(
                    (agent) => Number(agent.agencyId) === Number(agencyId),
                ),
            );
        } else {
            if (residencesIds && residencesIds.length > 0) {
                // Remove duplicate IDs
                const uniqueResidencesIds = [...new Set(residencesIds)];

                // First, check if all residences exist
                const allResidences = await this.residencesRepository.find({
                    where: { id: In(uniqueResidencesIds), isDeleted: false },
                });

                // Check if any requested residence doesn't exist
                if (allResidences.length !== uniqueResidencesIds.length) {
                    throw new NotFoundException(
                        'ERR_RESIDENCE_NOT_FOUNDshgnghddrtdhdjf',
                    );
                }

                // Now fetch residences with their agents
                residences = await this.residencesRepository.find({
                    where: { id: In(uniqueResidencesIds), isDeleted: false },
                    relations: ['agents'],
                });

                // Filter by agency
                const filteredResidences = residences.filter((residence) =>
                    residence.agents.some(
                        (agent) => Number(agent.agencyId) === Number(agencyId),
                    ),
                );

                // Check if any residence doesn't belong to this agency
                if (filteredResidences.length !== uniqueResidencesIds.length) {
                    throw new BadRequestException(
                        'ERR_RESIDENCE_NOT_PERMITTED',
                    );
                }

                residences = filteredResidences;
            }
        }

        if (createAgentDto.isOwner) {
            // verify if the agent is the only owner
            const agents = await this.agentsRepository.find({
                where: { agencyId, isDeleted: false, isOwner: true },
            });

            if (agents.length > 0) {
                throw new BadRequestException('ERR_AGENCY_ALREADY_HAS_OWNER');
            }
        }

        const saveAgent = {
            ...agentData,
            agencyId,
            password,
            residences,
        };

        return await this.agentsRepository.save(saveAgent);
    }

    async getAll(agencyId: number): Promise<Agent[]> {
        return await this.agentsRepository
            .createQueryBuilder('agent')
            .leftJoinAndSelect(
                'agent.residences',
                'residence',
                'residence.isDeleted = :isDeleted',
                { isDeleted: false },
            )
            .where('agent.agencyId = :agencyId', { agencyId })
            .andWhere('agent.isActive = :isActive', { isActive: true })
            .andWhere('agent.isDeleted = :isDeleted', { isDeleted: false })
            .getMany();
    }

    async getAgentsForAgency(
        agencyId: number,
    ): Promise<ReadAgentForAgencyDto[]> {
        const agents = await this.getAll(agencyId);

        const mappedAgents = await agents.map((agent) => {
            return {
                ...agent,
                loginUrl: `${envs.FRONTEND_URL}/agent/auto-login?token=${this.jwtService.sign({ id: agent.id })}`,
            };
        });

        return mappedAgents.map((agent) =>
            plainToClass(ReadAgentForAgencyDto, agent, {
                excludeExtraneousValues: true,
            }),
        );
    }

    async getById(id: number, select?: string[]): Promise<Agent> {
        const defaultSelect = Object.keys(Agent).filter(
            (key) => key !== 'password',
        );
        const selectFields = select || defaultSelect;

        const queryBuilder = this.agentsRepository
            .createQueryBuilder('agent')
            .leftJoinAndSelect(
                'agent.residences',
                'residence',
                'residence.isDeleted = :isDeleted',
                { isDeleted: false },
            )
            .where('agent.id = :id', { id })
            .andWhere('agent.isActive = :isActive', { isActive: true })
            .andWhere('agent.isDeleted = :isDeleted', { isDeleted: false });

        // Añadir los campos seleccionados
        selectFields.forEach((field) => {
            queryBuilder.addSelect(`agent.${field}`);
        });

        return await queryBuilder.getOne();
    }

    async getByEmail(email: string, select?: any): Promise<Agent> {
        const selectFields = select || ['id', 'firstName', 'email'];

        return await this.agentsRepository.findOne({
            where: { email },
            select: selectFields,
        });
    }

    async update(
        id: number,
        updateAgentDto: UpdateAgentDto,
        agencyId: number,
    ): Promise<Agent> {
        const agent = await this.agentsRepository.findOne({ where: { id } });

        if (!agent) {
            throw new NotFoundException('ERR_AGENT_NOT_FOUND');
        }

        if (updateAgentDto.allResidences) {
            const residences = await this.residencesRepository.find({
                where: { isDeleted: false },
                relations: ['agents'],
            });

            if (
                !residences.some((residence) =>
                    residence.agents.some(
                        (agent) => Number(agent.agencyId) === Number(agencyId),
                    ),
                )
            ) {
                throw new NotFoundException('ERR_AGENCY_NOT_ALLOWED');
            }

            agent.residences = residences;
        } else {
            const { residencesIds } = updateAgentDto;
            if (residencesIds && residencesIds.length > 0) {
                const residences = await this.residencesRepository.find({
                    where: { id: In(residencesIds), isDeleted: false },
                    relations: ['agents'],
                });

                if (residences.length !== residencesIds.length) {
                    throw new NotFoundException('ERR_RESIDENCE_NOT_FOUND');
                }

                if (
                    !residences.some((residence) =>
                        residence.agents.some(
                            (agent) =>
                                Number(agent.agencyId) === Number(agencyId),
                        ),
                    )
                ) {
                    throw new NotFoundException('ERR_AGENCY_NOT_ALLOWED');
                }

                agent.residences = residences;
            }
        }

        if (updateAgentDto.isOwner && !agent.isOwner) {
            // verify if the agent is the only owner
            const agents = await this.agentsRepository.find({
                where: { agencyId, isDeleted: false, isOwner: true },
            });

            if (agents.length > 0) {
                throw new BadRequestException('ERR_AGENCY_ALREADY_HAS_OWNER');
            }
        }

        const updatedAgent = {
            ...agent,
            ...updateAgentDto,
            updatedAt: new Date(),
        };

        return await this.agentsRepository.save(updatedAgent);
    }

    async UpdateAgentProfile(
        id: number,
        updateAgentProfileDto: UpdateAgentProfileDto,
    ): Promise<Agent> {
        const agent = await this.agentsRepository.findOne({ where: { id } });

        if (!agent) {
            throw new NotFoundException('ERR_AGENT_NOT_FOUND');
        }

        if (updateAgentProfileDto.password) {
            if (
                updateAgentProfileDto.password !==
                updateAgentProfileDto.confirmPassword
            ) {
                throw new BadGatewayException('ERR_PASSWORDS_NOT_MATCH');
            }

            const newHashPassword = await bcrypt.hash(
                updateAgentProfileDto.password,
                10,
            );

            return await this.agentsRepository.save({
                ...agent,
                ...updateAgentProfileDto,
                password: newHashPassword,
                updatedAt: new Date(),
            });
        }

        return await this.agentsRepository.save({
            ...agent,
            ...updateAgentProfileDto,
            updatedAt: new Date(),
        });
    }

    async checkAgentResidences(id: number): Promise<boolean> {
        const agent = await this.agentsRepository.findOne({
            where: { id, isDeleted: false },
        });

        if (!agent) {
            throw new NotFoundException('ERR_AGENT_NOT_FOUND');
        }

        const residences = await this.residencesRepository
            .createQueryBuilder('residence')
            .leftJoinAndSelect('residence.agents', 'agent')
            .where('agent.id = :id', { id })
            .andWhere('residence.isDeleted = :isDeleted', { isDeleted: false })
            .andWhere('agent.isDeleted = :isDeleted', { isDeleted: false })
            .getMany();

        for (const residence of residences) {
            if (residence.agents.length === 1) {
                return true;
            }
        }
        return false;
    }

    // method that returns all the appointments of an agent
    async getAgentAppointments(id: number): Promise<Appointment[]> {
        const agent = await this.agentsRepository.findOne({
            where: { id, isDeleted: false },
            relations: [
                'appointments',
                'appointments.residence',
                'appointments.client',
            ],
        });

        if (!agent) {
            throw new NotFoundException('ERR_AGENT_NOT_FOUND');
        }

        if (agent.appointments) {
            agent.appointments = agent.appointments.filter(
                (appointment) => appointment.isDeleted === false,
            );
        }

        return agent.appointments || [];
    }

    // method that returns all the appointments of an agent
    async getAgentCalendarAppointments(
        id: number,
    ): Promise<ReadCalendarAppointmentDto> {
        const agent = await this.agentsRepository.findOne({
            where: { id, isDeleted: false },
            relations: [
                'appointments',
                'appointments.residence',
                'appointments.client',
            ],
        });

        if (!agent) {
            throw new NotFoundException('ERR_AGENT_NOT_FOUND');
        }

        if (agent.appointments) {
            agent.appointments = agent.appointments.filter(
                (appointment) => appointment.isDeleted === false,
            );
        }

        const appointments: CalendarAppointmentDto[] = agent.appointments.map(
            (appointment) => {
                return {
                    id: appointment.id,
                    date: appointment.date,
                    hour: appointment.hour,
                    duration: appointment.duration,
                    notes: appointment.notes,
                    clientName: appointment.client.name,
                    clientEmail: appointment.client.email,
                    clientPhone: appointment.client.phone,
                    residenceName: appointment.residence.name,
                    residenceOwnerEmail: appointment.residence.ownerEmail,
                    status: appointment.status,
                };
            },
        );

        const minAndMaxHours = await this.workingDaysService.getMinMaxTimeHours(
            agent.id,
        );

        return {
            appointments: appointments,
            minHour: minAndMaxHours.minHour,
            maxHour: minAndMaxHours.maxHour,
        };
    }

    async getPendingMails(agentId: number, agencyId: number): Promise<any[]> {
        const appointments = await this.getAgentAppointments(agentId);
        const pendingMails = Promise.all(
            appointments
                .filter((appointment) => appointment.status === 'PENDING')
                .map(async (mail) => {
                    const agentConfirmToken = await this.jwtService.sign(
                        {
                            appointmentId: mail.id,
                            type: 'agent-confirm',
                            agencyId,
                            residenceId: mail.residenceId,
                        },
                        { expiresIn: '1d' },
                    );

                    const agentCancelToken = await this.jwtService.sign(
                        {
                            appointmentId: mail.id,
                            type: 'agent-cancel',
                            agencyId,
                            residenceId: mail.residenceId,
                        },
                        { expiresIn: '1d' },
                    );

                    const rescheduleToken = await this.jwtService.sign({
                        appointmentId: mail.id,
                        type: 'agent-reschedule',
                        agencyId,
                        residenceId: mail.residenceId,
                    });

                    const agentConfirmUrl = `${BASEURL}?tk=${agentConfirmToken}`;
                    const agentCancelUrl = `${BASEURL}?tk=${agentCancelToken}`;
                    const agentRescheduleUrl = `${BASEURL}/reschedule?tk=${rescheduleToken}`;

                    const residence = await this.residencesRepository.findOne({
                        where: { id: mail.residenceId },
                    });

                    const client = await this.clientsRepository.findOne({
                        where: { id: mail.clientId },
                    });

                    if (!residence || !client) {
                        throw new NotFoundException(
                            'ERR_RESIDENCE_OR_CLIENT_NOT_FOUND',
                        );
                    }

                    return {
                        id: mail.id,
                        date: mail.date,
                        hour: mail.hour,
                        notes: mail.notes,
                        residence: residence.name,
                        clientName: client.name,
                        clientEmail: client.email,
                        clientPhone: client.phone,
                        status: mail.status,
                        agentConfirmUrl,
                        agentCancelUrl,
                        agentRescheduleUrl,
                    };
                }),
        );
        return pendingMails;
    }

    async getReadMails(agentId: number): Promise<any[]> {
        const appointments = await this.getAgentAppointments(agentId);
        const notPendingMails = appointments.filter(
            (appointment) => appointment.status !== 'PENDING',
        );
        // get the appointments history with the status changes
        const appointmentsHistory = await Promise.all(
            notPendingMails.map(async (appointment) => {
                const history =
                    await this.statusHistoryService.getAppointmentStatusHistory(
                        appointment,
                    );
                return {
                    id: appointment.id,
                    date: appointment.date,
                    hour: appointment.hour,
                    notes: appointment.notes,
                    residence: appointment.residence.name,
                    clientName: appointment.client.name,
                    clientEmail: appointment.client.email,
                    clientPhone: appointment.client.phone,
                    agentConfirmation: appointment.agentConfirmation,
                    ownerConfirmation: appointment.ownerConfirmation,
                    history: history.map((status) => {
                        return {
                            status: status.status,
                            createdAt: status.createdAt,
                        };
                    }),
                };
            }),
        );

        return appointmentsHistory;
    }

    async delete(id: number): Promise<void> {
        const agent = await this.agentsRepository.findOne({
            where: { id, isDeleted: false },
            relations: ['residences'],
        });

        if (!agent) {
            throw new NotFoundException('ERR_AGENT_NOT_FOUND');
        }

        // if the agent is the only one in the agency and the agent has residences, he can't be deleted
        const agents = await this.agentsRepository.find({
            where: { agencyId: agent.agencyId, isDeleted: false },
            relations: ['residences'],
        });

        if (agents.length === 1 && agent.residences.length > 0) {
            throw new BadGatewayException('ERR_AGENT_HAS_RESIDENCES');
        }

        // if the agent is the only one in a residence, the agent is deleted and the residence is updated to have all the agents

        const residences = await this.residencesRepository
            .createQueryBuilder('residence')
            .leftJoinAndSelect('residence.agents', 'agent')
            .where('agent.id = :id', { id })
            .andWhere('residence.isDeleted = :isDeleted', { isDeleted: false })
            .andWhere('agent.isDeleted = :isDeleted', { isDeleted: false })
            .getMany();

        residences.forEach(async (residence) => {
            if (residence.agents.length === 1) {
                residence.agents = agents;
                residence.allAgents = true;
                await this.residencesRepository.save(residence);
            }
        });

        if (agent) {
            agent.isDeleted = true;
            agent.email = `${agent.email}-${agent.id}-deleted`;
            await this.agentsRepository.save(agent);
        }
    }

    async activate(id: number): Promise<Agent> {
        const agent = await this.agentsRepository.findOne({ where: { id } });

        if (!agent) {
            throw new NotFoundException('ERR_AGENT_NOT_FOUND');
        }

        return await this.agentsRepository.save({
            ...agent,
            isActive: true,
        });
    }

    /**
     * Creates the login token for the selected user.
     * @param id
     * @returns Promise<string>
     */
    async getAgentLoginToken(id: number): Promise<string> {
        const agent = await this.agentsRepository.findOne({
            where: { id },
            select: ['id', 'email', 'firstName', 'lastName'],
        });

        if (!agent) {
            throw new NotFoundException('ERR_AGENT_NOT_FOUND');
        }

        const payload = {
            id: agent.id,
            type: 'login',
        };

        const token = await this.jwtService.sign(payload, {
            expiresIn: '30d',
        });

        return `${envs.FRONTEND_URL}/login?token=${token}`;
    }

    async getHomeSearch(id: number): Promise<HomeSearchItemDto[]> {
        // 1) Get the agent residences
        const agent = await this.agentsRepository.findOne({
            where: { id },
            relations: ['residences'],
        });
        const residences: HomeSearchItemDto[] = agent.residences.map(
            (residence) => {
                return {
                    title: residence.name,
                    identifiers: [
                        Array.isArray(residence.identifiers)
                            ? residence.identifiers.join(', ')
                            : null,
                        ,
                        residence.name,
                    ].filter((a) => a), // remove nulls
                    actionUrl: `/agent/assigned-residences`,
                };
            },
        );

        // 2) Build schudule
        const appointments: HomeSearchItemDto[] = [
            {
                title: 'Mis Horarios',
                identifiers: [
                    'Domingo',
                    'Lunes',
                    'Martes',
                    'Miércoles',
                    'Jueves',
                    'Viernes',
                    'Sábado',
                    'Horarios',
                ],
                actionUrl: `/agent/schedule`,
            },
        ];

        return [...residences, ...appointments];
    }

    async forgotPassword(
        forgotPasswordDto: ForgotPasswordDto,
    ): Promise<boolean> {
        const agent = await this.agentsRepository.findOne({
            where: { email: forgotPasswordDto.email },
        });

        if (!agent) {
            throw new NotFoundException('ERR_AGENT_NOT_FOUND');
        }

        const token = await this.jwtService.sign(
            { id: agent.id, type: 'password-reset' },
            { expiresIn: '1h' },
        );

        // Update user with the token
        agent.resetPasswordToken = token;
        agent.resetPasswordExpires = new Date(Date.now() + 3600000).getTime(); // 1 hour
        await this.agentsRepository.save(agent);

        // Send email with the token
        await this.mailsService.sendForgotPasswordEmail({
            to: agent.email,
            token,
            obj: 'agent',
        });

        return true;
    }

    async resetPassword(
        id: number,
        resetPasswordDto: ResetPasswordDto,
    ): Promise<boolean> {
        const { password, confirmPassword, token } = resetPasswordDto;

        if (password !== confirmPassword) {
            throw new BadGatewayException('ERR_PASSWORDS_NOT_MATCH');
        }

        const agent = await this.agentsRepository.findOne({
            where: { id },
        });

        if (!agent) {
            throw new NotFoundException('ERR_AGENT_NOT_FOUND');
        }

        if (token !== agent.resetPasswordToken) {
            throw new BadRequestException('ERR_INVALID_TOKEN');
        }

        if (agent.resetPasswordExpires < Date.now()) {
            throw new BadRequestException('ERR_TOKEN_EXPIRED');
        }

        agent.password = await bcrypt.hash(password, 10);

        agent.resetPasswordToken = null;
        agent.resetPasswordExpires = null;
        agent.passwordResetedAt = Date.now();

        await this.agentsRepository.save(agent);

        return true;
    }

    async getOwner(id: number): Promise<ReadOwnerDto> {
        const agent = await this.agentsRepository.findOne({
            where: { id, isDeleted: false },
            relations: ['agency'],
        });

        if (!agent) {
            throw new NotFoundException('ERR_AGENT_NOT_FOUND');
        }

        if (!agent.isOwner) {
            throw new BadRequestException('ERR_AGENT_IS_NOT_OWNER');
        }

        return {
            token: this.jwtService.sign({
                id: agent.agencyId,
                type: 'agent-owner',
            }),
        };
    }
}
