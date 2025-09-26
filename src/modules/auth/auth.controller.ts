import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import type { Request, Response } from 'express';

// dto
import { GenericResponse } from 'src/shared/genericResponse.dto';
import { ReadAdminDto } from '../admins/dto/read-admin.dto';
import { ReadAgencyDto } from '../agencies/dto/read-agency.dto';
import { ReadAgentDto } from '../agents/dto/read-agent.dto';
import { LoginDto } from './dto/login.dto';
import { PrescriptorResponseDto } from '../prescriptors/dto/prescriptor-response.dto';

// services
import { AdminsService } from '../admins/admins.service';
import { AgenciesService } from '../agencies/agencies.service';
import { ConfigurationService } from '../agencies/modules/configuration/configuration.service';
import { AgentsService } from '../agents/agents.service';
import { AuthService } from './auth.service';
import { PrescriptorsService } from '../prescriptors/prescriptors.service';

// guards
import { AdminSessionGuard } from './guards/admin-session.guard';
import { AgencySessionGuard } from './guards/agency-session.guard';
import { AgentSessionGuard } from './guards/agent-session.guard';
import { PrescriptorSessionGuard } from './guards/prescriptor-session.guard';

// decorators
// import { Webhooks } from '../webhooks/enums/webhooks.enum';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly adminsService: AdminsService,
        private readonly agenciesService: AgenciesService,
        private readonly agentsService: AgentsService,
        private readonly configurationService: ConfigurationService,
        private readonly prescriptorsService: PrescriptorsService,
    ) {}

    @Public()
    @Post('/admin/login')
    async adminLogin(
        @Body() body: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<GenericResponse<string>> {
        const token = await this.authService.adminLogin(body);
        response.cookie('adminToken', token, {
            // httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            // sameSite: 'strict',
        });
        return new GenericResponse<string>(token);
    }

    @UseGuards(AdminSessionGuard)
    @Get('/admin/verify-session')
    async verifySessionAdmin(
        @Req() req: Request,
    ): Promise<GenericResponse<ReadAdminDto>> {
        const adminId = req['adminId'] ? req['adminId'] : -1;
        const admin = await this.adminsService.getById(adminId, [
            'id',
            'email',
            'firstName',
            'lastName',
            'isSuperAdmin',
        ]);
        const role = await this.authService.verifyTokenRole(req);
        if (role !== 'admin') {
            throw new UnauthorizedException('Unauthorized role');
        }
        const adminRes = plainToClass(ReadAdminDto, admin, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadAdminDto>(adminRes);
    }

    @Public()
    @Post('/agency/login')
    async agencyLogin(
        @Body() body: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<GenericResponse<string>> {
        const token = await this.authService.agencyLogin(body);
        response.cookie('agencyToken', token, {});
        return new GenericResponse<string>(token);
    }

    @UseGuards(AgencySessionGuard)
    @Get('/agency/verify-session')
    async verifySessionAgency(
        @Req() req: Request,
    ): Promise<GenericResponse<ReadAgencyDto>> {
        const agencyId = req['agencyId'] ? req['agencyId'] : -1;
        const agency = await this.agenciesService.getById(agencyId, [
            'id',
            'email',
            'name',
            'isSubscriptionActive',
        ]);
        const config =
            await this.configurationService.getConfiguration(agencyId);
        const role = await this.authService.verifyTokenRole(req);
        if (role !== 'agency') {
            throw new UnauthorizedException('Unauthorized role');
        }
        const agencyRes = plainToClass(ReadAgencyDto, agency, {
            excludeExtraneousValues: true,
        });
        const response = {
            ...agencyRes,
            primaryColor: config?.primaryColor,
            secondaryColor: config?.secondaryColor,
            logoUrl: config?.logoUrl,
        };
        return new GenericResponse<ReadAgencyDto>(response);
    }

    @Public()
    @Post('/agent/login')
    async agentLogin(
        @Body() body: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<GenericResponse<string>> {
        const token = await this.authService.agentLogin(body);
        response.cookie('agentToken', token, {
            // httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            // sameSite: 'strict',
        });
        return new GenericResponse<string>(token);
    }

    @UseGuards(AgentSessionGuard)
    @Get('/agent/verify-session')
    async verifySessionAgent(
        @Req() req: Request,
    ): Promise<GenericResponse<ReadAgentDto>> {
        const agentId = req['agentId'] ? req['agentId'] : -1;
        const agent = await this.agentsService.getById(agentId, [
            'id',
            'email',
            'firstName',
            'lastName',
            'agencyId',
        ]);
        const role = await this.authService.verifyTokenRole(req);
        if (role !== 'agent') {
            throw new UnauthorizedException('Unauthorized role');
        }
        const agentRes = plainToClass(ReadAgentDto, agent, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadAgentDto>(agentRes);
    }

    @Public()
    @Get('/widget/token/:agencyId')
    async widgetToken(@Req() req: Request): Promise<GenericResponse<string>> {
        const agencyId = Number(req.params.agencyId);
        const token = await this.authService.widgetToken(agencyId);
        return new GenericResponse<string>(token);
    }

    @UseGuards(AgencySessionGuard)
    @Get('/agencies/:agencyId/webhook/token/:type')
    async webhookToken(
        @Param('agencyId', ParseIntPipe) agencyId: number,
        // @Param('type') type: Webhooks,
    ): Promise<GenericResponse<string>> {
        const token = await this.authService.webhookToken(agencyId);
        return new GenericResponse(token);
    }

    @Public()
    @Post('/agency/auto-login')
    async autoLogin(
        @Body('token') token: string,
        @Res({ passthrough: true }) response: Response,
    ): Promise<GenericResponse<string>> {
        const result = await this.authService.agencyAutoLogin(token);
        response.cookie('agencyToken', result, {});
        return new GenericResponse<string>(result);
    }

    @Public()
    @Post('/agent/auto-login')
    async autoLoginAgent(
        @Body('token') token: string,
        @Res({ passthrough: true }) response: Response,
    ): Promise<GenericResponse<string>> {
        const result = await this.authService.agentAutoLogin(token);
        response.cookie('agentToken', result, {});
        return new GenericResponse<string>(result);
    }

    @Public()
    @Post('/agent/forgot-password')
    async forgotPassword(
        @Body() body: ForgotPasswordDto,
    ): Promise<GenericResponse<boolean>> {
        const result = await this.agentsService.forgotPassword(body);
        return new GenericResponse<boolean>(result);
    }

    @Public()
    @Post('/agent/:agentId/reset-password')
    async resetPassword(
        @Param('agentId', ParseIntPipe) id: number,
        @Body() body: ResetPasswordDto,
    ): Promise<GenericResponse<boolean>> {
        const result = await this.agentsService.resetPassword(id, body);
        return new GenericResponse<boolean>(result);
    }

    @Public()
    @Post('/agency/forgot-password')
    async forgotPasswordAgency(
        @Body() body: ForgotPasswordDto,
    ): Promise<GenericResponse<boolean>> {
        const result = await this.agenciesService.forgotPassword(body);
        return new GenericResponse<boolean>(result);
    }

    @Public()
    @Post('/agency/:agencyId/reset-password')
    async resetPasswordAgency(
        @Param('agencyId', ParseIntPipe) id: number,
        @Body() body: ResetPasswordDto,
    ): Promise<GenericResponse<boolean>> {
        const result = await this.agenciesService.resetPassword(id, body);
        return new GenericResponse<boolean>(result);
    }

    @Public()
    @Post('prescriptor/login')
    async prescriptorLogin(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<GenericResponse<string>> {
        const token = await this.authService.prescriptorLogin(loginDto);
        response.cookie('prescriptorToken', token, {
            // httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            // sameSite: 'strict',
        });
        return new GenericResponse<string>(token);
    }

    @UseGuards(PrescriptorSessionGuard)
    @Get('/prescriptor/verify-session')
    async verifySessionPrescriptor(
        @Req() req: Request,
    ): Promise<GenericResponse<PrescriptorResponseDto>> {
        const prescriptorId = req['prescriptorId'] ? req['prescriptorId'] : -1;
        const prescriptor = await this.prescriptorsService.getById(
            prescriptorId,
            [
                'id',
                'email',
                'firstName',
                'lastName',
                'phoneNumber',
                'referenceCode',
                'isVerified',
                'isActive',
                'createdAt',
                'updatedAt',
            ],
        );

        const role = await this.authService.verifyTokenRole(req);
        if (role !== 'prescriptor') {
            throw new UnauthorizedException('Unauthorized role');
        }

        const prescriptorRes = plainToClass(
            PrescriptorResponseDto,
            prescriptor,
            {
                excludeExtraneousValues: true,
            },
        );

        return new GenericResponse<PrescriptorResponseDto>(prescriptorRes);
    }
}
