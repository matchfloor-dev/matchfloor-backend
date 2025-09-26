import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcryptjs';
import { Request } from 'express';

// dto
import { LoginDto } from './dto/login.dto';

// services
import { AdminsService } from '../admins/admins.service';
import { AgenciesService } from '../agencies/agencies.service';
import { AgentsService } from '../agents/agents.service';
import { PrescriptorsService } from '../prescriptors/prescriptors.service';
import { JwtRoles } from './enums/roles.enum';
// import { Webhooks } from '../webhooks/enums/webhooks.enum';

@Injectable()
export class AuthService {
    constructor(
        private readonly adminsService: AdminsService,
        private readonly agenciesService: AgenciesService,
        private readonly agentsService: AgentsService,
        private readonly prescriptorsService: PrescriptorsService,
        private readonly jwtService: JwtService,
    ) {}

    async adminLogin(body: LoginDto): Promise<string> {
        const { email, password } = body;

        // 1. Find the admin by email
        const admin = await this.adminsService.getByEmail(email, [
            'id',
            'email',
            'password',
            'isActive',
        ]);

        // 2. Check if the admin exists
        if (!admin || !admin.isActive || admin.isDeleted) {
            throw new BadRequestException('ERR_ADMIN_NOT_FOUND');
        }

        // 3. Check if the password is correct
        const isPasswordCorrect = await bcrypt.compare(
            password,
            admin.password,
        );

        if (!isPasswordCorrect) {
            throw new BadRequestException('ERR_INVALID_PASSWORD');
        }

        // 4. Generate the JWT token
        const payload = {
            id: admin.id,
            email: admin.email,
            role: JwtRoles.ADMIN,
        };
        const token = this.jwtService.sign(payload);

        return token;
    }

    async agencyLogin(body: LoginDto): Promise<string> {
        const { email, password } = body;

        // 1. Find the agency by email
        const agency = await this.agenciesService.getByEmail(email, [
            'id',
            'email',
            'password',
            'isActive',
        ]);

        // 2. Check if the agency exists
        if (!agency || !agency.isActive || agency.isDeleted) {
            throw new BadRequestException('ERR_AGENCY_NOT_FOUND');
        }

        // 3. Check if the password is correct
        const isPasswordCorrect = await bcrypt.compare(
            password,
            agency.password,
        );

        if (!isPasswordCorrect) {
            throw new BadRequestException('ERR_INVALID_PASSWORD');
        }

        // 4. Generate the JWT token
        const payload = {
            id: agency.id,
            email: agency.email,
            role: JwtRoles.AGENCY,
        };
        const token = this.jwtService.sign(payload);

        return token;
    }

    async agentLogin(body: LoginDto): Promise<string> {
        const { email, password } = body;

        // 1. Find the agent by email
        const agent = await this.agentsService.getByEmail(email, [
            'id',
            'email',
            'password',
            'isActive',
        ]);

        // 2. Check if the agent exists
        if (!agent || !agent.isActive || agent.isDeleted) {
            throw new BadRequestException('ERR_AGENT_NOT_FOUND');
        }

        // 3. Check if the password is correct
        const isPasswordCorrect = await bcrypt.compare(
            password,
            agent.password,
        );

        if (!isPasswordCorrect) {
            throw new BadRequestException('ERR_INVALID_PASSWORD');
        }

        // 4. Generate the JWT token
        const payload = {
            id: agent.id,
            email: agent.email,
            role: JwtRoles.AGENT,
        };
        const token = this.jwtService.sign(payload);

        return token;
    }

    async widgetToken(agencyId: number): Promise<string> {
        // 1. Find the agency by id
        const { widgetKey } = await this.agenciesService.getAgencyApiKeys(agencyId);

        // 2. Check if the agency exists
        if (!widgetKey) {
            throw new BadRequestException('ERR_AGENCY_NOT_FOUND');
        }

        return widgetKey;
    }

    async webhookToken(agencyId: number): Promise<string> {
        // 1. Find the agency by id
        const { adminKey } = await this.agenciesService.getAgencyApiKeys(agencyId);

        // 2. Check if the agency exists
        if (!adminKey) {
            throw new BadRequestException('ERR_AGENCY_NOT_FOUND');
        }

        // 3. Generate the JWT tokenpm
        return adminKey;
    }

    async agencyAutoLogin(token: string): Promise<string> {

        // if the token starts with "mf_adm" we dont decode because is not a jwt, is a webhook token
        if (token.startsWith('mf_adm')) {
            // get the agency from the token
            const agency = await this.agenciesService.getByWebhookToken(token);

            if (!agency || agency.isDeleted) {
                throw new BadRequestException('ERR_AGENCY_NOT_FOUND');
            }

            const newPayload = {
                id: agency.id,
                email: agency.email,
                role: JwtRoles.AGENCY,
            };
            const newToken = this.jwtService.sign(newPayload);

            return newToken;
        }

        const payload = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_SECRET,
        });

        if (!payload) {
            throw new BadRequestException('ERR_INVALID_TOKEN');
        }

        const agency = await this.agenciesService.getById(payload.id);

        if (!agency || agency.isDeleted) {
            throw new BadRequestException('ERR_AGENCY_NOT_FOUND');
        }

        const newPayload = {
            id: agency.id,
            email: agency.email,
            role: JwtRoles.AGENCY,
        };
        const newToken = this.jwtService.sign(newPayload);

        return newToken;
    }

    async agentAutoLogin(token: string): Promise<string> {
        const payload = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_SECRET,
        });

        if (!payload) {
            throw new BadRequestException('ERR_INVALID_TOKEN');
        }

        const agent = await this.agentsService.getById(payload.id);

        if (!agent || agent.isDeleted) {
            throw new BadRequestException('ERR_AGENT_NOT_FOUND');
        }

        const newPayload = {
            id: agent.id,
            email: agent.email,
            role: JwtRoles.AGENT,
        };
        const newToken = this.jwtService.sign(newPayload);

        return newToken;
    }

    async verifyTokenRole(req: Request): Promise<string> {
        const token = this.extractTokenFromHeader(req);

        if (!token) {
            throw new BadRequestException('ERR_NO_TOKEN_PROVIDED');
        }

        const payload = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_SECRET,
        });

        if (!payload) {
            throw new BadRequestException('ERR_INVALID_TOKEN');
        }

        return payload.role;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }

    async prescriptorLogin(body: LoginDto): Promise<string> {
        const { email, password } = body;

        // 1. Find the prescriptor by email
        const prescriptor = await this.prescriptorsService.getByEmail(email, [
            'id',
            'email',
            'password',
            'isActive',
            'isVerified',
        ]);

        // 2. Check if the prescriptor exists and is verified
        if (!prescriptor || !prescriptor.isActive || prescriptor.isDeleted || !prescriptor.isVerified) {
            throw new BadRequestException('ERR_PRESCRIPTOR_NOT_FOUND_OR_NOT_VERIFIED');
        }

        // 3. Check if the password is correct
        const isPasswordCorrect = await bcrypt.compare(
            password,
            prescriptor.password,
        );

        if (!isPasswordCorrect) {
            throw new BadRequestException('ERR_INVALID_PASSWORD');
        }

        // 4. Generate JWT token
        return this.jwtService.sign({
            id: prescriptor.id,
            email: prescriptor.email,
            role: JwtRoles.PRESCRIPTOR,
        });
    }
}
