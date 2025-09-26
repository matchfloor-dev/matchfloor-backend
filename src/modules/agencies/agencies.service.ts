import {
    BadGatewayException,
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

// services
import { MailsService } from '../mails/mails.service';

// entities
import { Agency } from './entities/agency.entity';

// dto
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { ResetPasswordDto } from '../auth/dto/reset-password.dto';
import { ForgotPasswordDto } from '../auth/dto/forgot-password.dto';
import {
    ReadCalendarAppointmentDto,
    CalendarAppointmentDto,
} from '../agents/dto/read-calendar-appointment.dto';

// interfaces
import { CRUD } from 'src/shared/interfaces/crud.interface';

// services
import { JwtService } from '@nestjs/jwt';
import { ResidencesService } from '../residences/residences.service';
import { WorkingDaysService } from './modules/working-days/working-days.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

// config
import { envs } from 'src/config/envs.config';
import { HomeSearchItemDto } from 'src/shared/dto/home-search-item.dto';
import { Agent } from '../agents/entities/agent.entity';
import { ReadOwnerDto } from './dto/read-owner.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { StripeService } from '../payments/modules/stripe/stripe.service';
import { Prescriptor } from '../prescriptors/entities/prescriptor.entity';

@Injectable()
export class AgenciesService implements CRUD<Agency> {
    constructor(
        @InjectRepository(Agency)
        private readonly agenciesRepository: Repository<Agency>,
        @InjectRepository(Agent)
        private readonly agentsRepository: Repository<Agent>,
        @InjectRepository(Prescriptor)
        private readonly prescriptorsRepository: Repository<Prescriptor>,

        private readonly mailsService: MailsService,
        private readonly jwtService: JwtService,
        private readonly residencesService: ResidencesService,
        private readonly workingDaysService: WorkingDaysService,
        @Inject(forwardRef(() => SubscriptionsService))
        private readonly subscriptionsService: SubscriptionsService,

        @Inject(forwardRef(() => StripeService))
        private readonly stripeService: StripeService,
    ) {}

    async create(createAgencyDto: CreateAgencyDto): Promise<Agency> {
        if (createAgencyDto.password !== createAgencyDto.passwordConfirmation) {
            throw new BadGatewayException('ERR_PASSWORDS_NOT_MATCH');
        }

        const password = await bcrypt.hash(createAgencyDto.password, 10);

        const planId = createAgencyDto.planId;
        // const useFreeTrial = createAgencyDto.useFreeTrial;
        delete createAgencyDto.planId;
        delete createAgencyDto.useFreeTrial;

        // Handle prescriptor reference code
        let prescriptor = null;
        if (createAgencyDto.prescriptorReferenceCode) {
            try {
                // Find prescriptor by reference code
                prescriptor = await this.prescriptorsRepository.findOne({
                    where: { 
                        referenceCode: createAgencyDto.prescriptorReferenceCode,
                        isActive: true,
                        isVerified: true,
                        isDeleted: false
                    }
                });
                
                if (!prescriptor) {
                    throw new BadRequestException('ERR_INVALID_PRESCRIPTOR_REFERENCE_CODE');
                }
            } catch (error) {
                if (error instanceof BadRequestException) {
                    throw error;
                }
                // If there's any other error, just ignore the reference code
                console.error('Error finding prescriptor:', error);
            }
        }

        const verificationCode = Math.floor(1000 + Math.random() * 9000);

        const saveAgency = {
            ...createAgencyDto,
            password,
            verificationCode,
            prescriptor: prescriptor
        };

        // Creates agency
        const agency = await this.agenciesRepository.save(saveAgency);

        // Assign plan to the agency
        try {
            // await this.subscriptionsService.subscribe(agency.id, planId, useFreeTrial);
            await this.subscriptionsService.subscribeForRegister(
                agency.id,
                planId,
            );

            // Deactivate agency until email verification
            agency.isActive = false;
            await this.agenciesRepository.save(agency);

            // send mail with code'
            await this.mailsService.sendVerificationCodeMail({
                to: agency.email,
                code: verificationCode,
            });
        } catch (error) {
            // Rollback agency creation
            await this.agenciesRepository.delete(agency.id);
            throw error;
        }

        return agency;
    }

    async verifyEmail(
        data: VerifyEmailDto,
    ): Promise<any> {
        const { email, code } = data;

        // Find agency by email and verification code
        const agency = await this.agenciesRepository.findOne({
            where: { email, verificationCode: code },
        });

        if (!agency) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        // Activate agency
        agency.isActive = true;
        // agency.verificationCode = null;
        await this.agenciesRepository.save(agency);

        // Get the user checkout card details
        const { url, customerId } = await this.stripeService.createCardCheckoutSession(agency);

        // save the customer id
        agency.stripeCustomerId = customerId;
        await this.agenciesRepository.save(agency);

        // Notify admins of new agency
        this.mailsService.sendNewAgencyAdminEmail({
            to: "francobaezagraf@gmail.com",
            agencyName: agency.name,
            agencyMail: agency.email
        });

        return { checkoutUrl: url }
    }

    async register(createAgencyDto: CreateAgencyDto): Promise<Agency> {
        if (createAgencyDto.password !== createAgencyDto.passwordConfirmation) {
            throw new BadGatewayException('ERR_PASSWORDS_NOT_MATCH');
        }

        const password = await bcrypt.hash(createAgencyDto.password, 10);

        const planId = createAgencyDto.planId;
        const packId = createAgencyDto.packId;
        
        // Remove fields that should not be saved directly
        delete createAgencyDto.planId;
        delete createAgencyDto.packId;
        delete createAgencyDto.useFreeTrial;
        delete createAgencyDto.passwordConfirmation;

        // Handle prescriptor reference code
        let prescriptor = null;
        if (createAgencyDto.prescriptorReferenceCode) {
            try {
                // Find prescriptor by reference code
                prescriptor = await this.prescriptorsRepository.findOne({
                    where: { 
                        referenceCode: createAgencyDto.prescriptorReferenceCode,
                        isActive: true,
                        isVerified: true,
                        isDeleted: false
                    }
                });
                
                if (!prescriptor) {
                    throw new BadRequestException('ERR_INVALID_PRESCRIPTOR_REFERENCE_CODE');
                }
            } catch (error) {
                if (error instanceof BadRequestException) {
                    throw error;
                }
                // If there's any other error, just ignore the reference code
                console.error('Error finding prescriptor:', error);
            }
        }

        const verificationCode = Math.floor(1000 + Math.random() * 9000);

        const saveAgency = {
            ...createAgencyDto,
            password,
            verificationCode,
            prescriptor: prescriptor
        };

        // Creates agency
        const agency = await this.agenciesRepository.save(saveAgency);

        // Creates admin user
        await this.agentsRepository.save({
            firstName: createAgencyDto.firstName,
            lastName: createAgencyDto.lastName,
            email: createAgencyDto.email,
            password,
            agencyId: agency.id,
            isOwner: true,
            isActive: true,
            isDeleted: false,
            allResidences: true,
        });

        // Assign plan to the agency
        try {
            // Handle subscription with or without user pack
            if (packId) {
                await this.subscriptionsService.subscribeWithPackForRegister(
                    agency.id,
                    planId,
                    packId
                );
            } else {
                await this.subscriptionsService.subscribeForRegister(
                    agency.id,
                    planId
                );
            }

            // Deactivate agency until email verification
            agency.isActive = false;
            await this.agenciesRepository.save(agency);

            // send mail with code
            await this.mailsService.sendVerificationCodeMail({
                to: agency.email,
                code: verificationCode,
            });
        } catch (error) {
            // Rollback agency creation
            await this.agenciesRepository.delete(agency.id);
            throw error;
        }

        return agency;
    }

    async getAll(): Promise<Agency[]> {
        return await this.agenciesRepository.find({
            where: { isActive: true, isDeleted: false },
            relations: [
                'subscriptions',
                'subscriptions.payments',
                'subscriptions.plan',
            ],
        });
    }

    async getById(
        id: number,
        select?: any,
        relations?: any[],
    ): Promise<Agency> {
        const defaultSelect = Object.keys(Agency).filter(
            (key) => key !== 'password',
        );
        const selectFields = select || defaultSelect;

        return await this.agenciesRepository.findOne({
            where: { id, isActive: true, isDeleted: false },
            select: selectFields,
            relations: relations,
        });
    }

    async getByEmail(email: string, select?: any): Promise<Agency> {
        const selectFields = select || ['id', 'name', 'email'];

        return await this.agenciesRepository.findOne({
            where: { email },
            select: selectFields,
        });
    }

    async update(
        id: number,
        updateAgencyDto: UpdateAgencyDto,
    ): Promise<Agency> {
        const agency = await this.agenciesRepository.findOne({
            where: { id },
        });

        if (!agency) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        const updatedAgency = {
            ...agency,
            ...updateAgencyDto,
            updatedAt: new Date(),
        };

        return await this.agenciesRepository.save(updatedAgency);
    }

    async delete(id: number): Promise<void> {
        const agency = await this.agenciesRepository.findOne({
            where: { id },
            relations: ['agents'],
        });

        if (!agency) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        const agents = agency?.agents;

        if (agents) {
            for (const agent of agents) {
                await this.agentsRepository.save({
                    ...agent,
                    isActive: false,
                    isDeleted: true,
                });
            }
        }

        await this.agenciesRepository.save({
            ...agency,
            isDeleted: true,
        });
    }

    /**
     * Creates the login token for the selected user.
     * @param id
     * @returns Promise<string>
     */
    async getAgencyLoginToken(id: number): Promise<string> {
        const agency = await this.agenciesRepository.findOne({
            where: { id },
            select: ['id', 'email', 'name'],
        });

        if (!agency) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        const payload = {
            id: agency.id,
            type: 'login',
        };

        const token = await this.jwtService.sign(payload, {
            expiresIn: '30d',
        });

        return `${envs.FRONTEND_URL}/login?token=${token}`;
    }

    async getHomeSearch(id: number): Promise<HomeSearchItemDto[]> {
        // 1) Get the agency residences
        const residences = await this.residencesService.getAll(id);
        const mappedResidences: HomeSearchItemDto[] = residences.map(
            (residence) => {
                return {
                    title: residence.name,
                    identifiers: [
                        Array.isArray(residence.identifiers)
                            ? residence.identifiers.join(', ')
                            : null,
                        residence.ownerEmail,
                        residence.id.toString(),
                        residence.name,
                    ].filter((a) => a), // remove nulls
                    // actionUrl: `/agency/residences/${residence.id}`,
                    actionUrl: `/agency/residences`,
                };
            },
        );

        // 2) Get the agency agents
        const agency = await this.agenciesRepository.findOne({
            where: { id },
            relations: ['agents'],
        });
        const agents = agency?.agents;
        const mappedAgents: HomeSearchItemDto[] = agents?.map((agent) => {
            return {
                title: `${agent.firstName} ${agent.lastName ? agent.lastName : ''}`,
                identifiers: [
                    agent.email,
                    agent.id.toString(),
                    agent.firstName,
                    agent.lastName,
                ],
                // actionUrl: `/agency/agents/${agent.id}`,
                actionUrl: `/agency/agents`,
            };
        });

        return [...mappedResidences, ...mappedAgents];
    }

    async forgotPassword(
        forgotPasswordDto: ForgotPasswordDto,
    ): Promise<boolean> {
        const agency = await this.agenciesRepository.findOne({
            where: { email: forgotPasswordDto.email },
        });

        if (!agency) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        const token = await this.jwtService.sign(
            { id: agency.id, type: 'password-reset' },
            { expiresIn: '1h' },
        );

        // Update user with the token
        agency.resetPasswordToken = token;
        agency.resetPasswordExpires = new Date(Date.now() + 3600000).getTime(); // 1 hour
        await this.agenciesRepository.save(agency);

        // Send email with the token
        await this.mailsService.sendForgotPasswordEmail({
            to: agency.email,
            token,
            obj: 'agency',
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

        const agency = await this.agenciesRepository.findOne({
            where: { id },
        });

        if (!agency) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        if (token !== agency.resetPasswordToken) {
            throw new BadRequestException('ERR_INVALID_TOKEN');
        }

        if (agency.resetPasswordExpires < Date.now()) {
            throw new BadRequestException('ERR_TOKEN_EXPIRED');
        }

        agency.password = await bcrypt.hash(password, 10);

        agency.resetPasswordToken = null;
        agency.resetPasswordExpires = null;
        agency.passwordResetedAt = Date.now();

        await this.agenciesRepository.save(agency);

        return true;
    }

    async getOwner(agencyId: number): Promise<ReadOwnerDto> {
        const agency = await this.agenciesRepository.findOne({
            where: { id: agencyId },
            relations: ['agents'],
        });

        if (!agency) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        const owner = agency.agents.find(
            (agent) => agent.isOwner && !agent.isDeleted,
        );

        if (!owner) {
            throw new NotFoundException('ERR_OWNER_NOT_FOUND');
        }

        return {
            token: this.jwtService.sign({ id: owner.id, type: 'agency-owner' }),
        };
    }

    async getAgencyCalendarAppointments(
        agencyId: number,
    ): Promise<ReadCalendarAppointmentDto> {
        // Fetch agency and related agents with their appointments
        const agency = await this.agenciesRepository.findOne({
            where: { id: agencyId, isDeleted: false },
            relations: [
                'agents',
                'agents.appointments',
                'agents.appointments.residence',
                'agents.appointments.client',
            ],
        });

        if (!agency) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        if (!agency.agents) {
            throw new NotFoundException('ERR_NO_AGENTS');
        }

        let allAppointments: CalendarAppointmentDto[] = [];

        // Iterate over each agent in the agency
        for (const agent of agency.agents) {
            if (agent.appointments) {
                // Filter out deleted appointments
                const filteredAppointments = agent.appointments.filter(
                    (appointment) => appointment.isDeleted === false,
                );

                // Map the appointments to CalendarAppointmentDto
                const agentAppointments: CalendarAppointmentDto[] =
                    filteredAppointments.map((appointment) => ({
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
                        agentName: agent.firstName, // Include agent's name for clarity
                        agentLastName: agent.lastName, // Include agent's last name for clarity
                        agentEmail: agent.email, // Include agent's email for clarity
                    }));

                // Add the agent's appointments to the list of all appointments
                allAppointments = allAppointments.concat(agentAppointments);
            }
        }

        // Get min and max working hours for the agency
        const minAndMaxHours = await this.workingDaysService.getMinMaxTimeHours(
            agency.id,
        );

        return {
            appointments: allAppointments,
            minHour: minAndMaxHours.minHour,
            maxHour: minAndMaxHours.maxHour,
        };
    }

    async getAgencyByStripeCustomerId(
        stripeCustomerId: string,
    ): Promise<Agency> {
        return await this.agenciesRepository.findOne({
            where: { stripeCustomerId },
            relations: ['subscriptions'],
        });
    }

    async updateAgencyStripePaymentMethod(
        agencyId: number,
        paymentMethodId: string,
    ): Promise<void> {
        const agency = await this.agenciesRepository.findOne({
            where: { id: agencyId },
        });

        if (!agency) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        // Update the payment method
        agency.stripePaymentMethodId = paymentMethodId;
        await this.agenciesRepository.save(agency);
    }

    async getAgencyApiKeys(agencyId: number): Promise<{ adminKey: string, widgetKey: string }> {
        const agency = await this.agenciesRepository.findOne({
            where: { id: agencyId },
        });

        if (!agency || agency.isDeleted) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        if(agency.adminKey && agency.widgetKey) {
            return {
                adminKey: agency.adminKey,
                widgetKey: agency.widgetKey,
            };
        }

        // Generate new keys
        const adminKey = this.generateApiKey('admin');
        const widgetKey = this.generateApiKey('widget');

        agency.adminKey = adminKey;
        agency.widgetKey = widgetKey;
        await this.agenciesRepository.save(agency);

        return {
            adminKey,
            widgetKey,
        };
    }

    /**
     * Generates a unique API key
     */
    private generateApiKey(type: 'admin' | 'widget'): string {
        const prefix = type === 'admin' ? 'mf_adm_' : 'mf_wgt_';
        const randomString = crypto.randomBytes(16).toString('hex');
        return `${prefix}${randomString}`;
    }

    async getByWebhookToken(token: string): Promise<Agency> {
        return await this.agenciesRepository.findOne({
            where: { adminKey: token },
        });
    }

    async getByWidgetToken(token: string): Promise<Agency> {
        return await this.agenciesRepository.findOne({
            where: { widgetKey: token },
        });
    }
}
