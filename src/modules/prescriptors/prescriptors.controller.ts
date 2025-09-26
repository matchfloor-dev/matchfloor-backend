import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    Get,
    UseGuards,
    Req,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Request } from 'express';

// Services
import { PrescriptorsService } from './prescriptors.service';

// DTOs
import { RegisterPrescriptorDto } from './dto/register-prescriptor.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { PrescriptorResponseDto } from './dto/prescriptor-response.dto';
import { ReferredAgencyDto } from './dto/referred-agency.dto';
import { DashboardDto } from './dto/dashboard.dto';
import { GenericResponse } from 'src/shared/genericResponse.dto';

// Guards
import { PrescriptorSessionGuard } from '../auth/guards/prescriptor-session.guard';

// Decorators
import { Public } from 'src/modules/auth/decorators/public.decorator';

@Controller('prescriptors')
export class PrescriptorsController {
    constructor(private readonly prescriptorsService: PrescriptorsService) {}

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(
        @Body() registerPrescriptorDto: RegisterPrescriptorDto,
    ): Promise<GenericResponse<PrescriptorResponseDto>> {
        const prescriptor = await this.prescriptorsService.register(registerPrescriptorDto);
        
        const response = plainToClass(PrescriptorResponseDto, prescriptor, {
            excludeExtraneousValues: true,
        });
        
        return new GenericResponse<PrescriptorResponseDto>(response);
    }

    @Public()
    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    async verifyEmail(
        @Body() verifyEmailDto: VerifyEmailDto,
    ): Promise<GenericResponse<{ token: string }>> {
        const result = await this.prescriptorsService.verifyEmail(verifyEmailDto);
        return new GenericResponse<{ token: string }>(result);
    }

    @UseGuards(PrescriptorSessionGuard)
    @Get('referred-agencies')
    @HttpCode(HttpStatus.OK)
    async getReferredAgencies(
        @Req() req: Request,
    ): Promise<GenericResponse<ReferredAgencyDto[]>> {
        const prescriptorId = req['prescriptorId'];
        const agencies = await this.prescriptorsService.getReferredAgencies(prescriptorId);
        return new GenericResponse<ReferredAgencyDto[]>(agencies);
    }

    @UseGuards(PrescriptorSessionGuard)
    @Get('dashboard')
    @HttpCode(HttpStatus.OK)
    async getDashboard(
        @Req() req: Request,
    ): Promise<GenericResponse<DashboardDto>> {
        const prescriptorId = req['prescriptorId'];
        const dashboard = await this.prescriptorsService.getDashboard(prescriptorId);
        return new GenericResponse<DashboardDto>(dashboard);
    }
} 