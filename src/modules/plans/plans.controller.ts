import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Patch,
} from '@nestjs/common';
import { PlansService } from './plans.service';

import { CreateUserPackDto } from './dto/create-user-pack.dto';
import { UpdateUserPackDto } from './dto/update-user-pack.dto';
import { AdminSessionGuard } from '../auth/guards/admin-session.guard';
import { GenericResponse } from 'src/shared/genericResponse.dto';
import { plainToClass } from 'class-transformer';

// dto
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { ReadPlansDto } from './dto/read-plans.dto';
import { ReadUserPackDto } from './dto/read-user-pack.dto';
import { DefaultPlanResponseDto } from './dto/default-plan-response.dto';
import { AgencySessionGuard } from '../auth/guards/agency-session.guard';

@Controller('plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) {}

    // Plan endpoints
    @Post()
    @UseGuards(AdminSessionGuard)
    async createPlan(@Body() createPlanDto: CreatePlanDto): Promise<GenericResponse<ReadPlansDto>> {
        const plan = await this.plansService.createPlan(createPlanDto);
        const planResponse = plainToClass(ReadPlansDto, plan, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadPlansDto>(planResponse);
    }

    @Get()
    @UseGuards(AgencySessionGuard)
    async getAllPlans(): Promise<GenericResponse<ReadPlansDto[]>> {
        const plans = await this.plansService.getAllPlans();
        const plansResponse = plans.map((plan) =>
            plainToClass(ReadPlansDto, plan, {
                excludeExtraneousValues: true,
            }),
        );
        return new GenericResponse<ReadPlansDto[]>(plansResponse);
    }

    @Get('default')
    async getDefaultPlan(): Promise<GenericResponse<DefaultPlanResponseDto>> {
        const { plan, userPacks } = await this.plansService.getDefaultPlanWithUserPacks();
        
        const response = {
            plan: plainToClass(ReadPlansDto, plan, { excludeExtraneousValues: true }),
            userPacks: userPacks.map(userPack => 
                plainToClass(ReadUserPackDto, userPack, { excludeExtraneousValues: true })
            )
        };
        
        return new GenericResponse<DefaultPlanResponseDto>(response as DefaultPlanResponseDto);
    }

    @Get(':id')
    @UseGuards(AgencySessionGuard)
    async getPlanById(@Param('id') id: string): Promise<GenericResponse<ReadPlansDto>> {
        const plan = await this.plansService.getPlanById(+id);
        const planResponse = plainToClass(ReadPlansDto, plan, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadPlansDto>(planResponse);
    }

    @Patch(':id')
    @UseGuards(AdminSessionGuard)
    async updatePlan(
        @Param('id') id: string,
        @Body() updatePlanDto: UpdatePlanDto,
    ): Promise<GenericResponse<ReadPlansDto>> {
        const plan = await this.plansService.updatePlan(+id, updatePlanDto);
        const planResponse = plainToClass(ReadPlansDto, plan, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadPlansDto>(planResponse);
    }

    @Delete(':id')
    @UseGuards(AdminSessionGuard)
    async deletePlan(@Param('id') id: string): Promise<GenericResponse<null>> {
        await this.plansService.deletePlan(+id);
        return new GenericResponse<null>(null);
    }

    // User Pack endpoints
    @Post('user-packs')
    @UseGuards(AdminSessionGuard)
    async createUserPack(@Body() createUserPackDto: CreateUserPackDto): Promise<GenericResponse<ReadUserPackDto>> {
        const userPack = await this.plansService.createUserPack(createUserPackDto);
        const userPackResponse = plainToClass(ReadUserPackDto, userPack, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadUserPackDto>(userPackResponse);
    }

    @Get('user-packs')
    @UseGuards(AgencySessionGuard)
    async getAllUserPacks(): Promise<GenericResponse<ReadUserPackDto[]>> {
        const userPacks = await this.plansService.getAllUserPacks();
        const userPacksResponse = userPacks.map((userPack) =>
            plainToClass(ReadUserPackDto, userPack, {
                excludeExtraneousValues: true,
            }),
        );
        return new GenericResponse<ReadUserPackDto[]>(userPacksResponse);
    }

    @Get('user-packs/:id')
    @UseGuards(AgencySessionGuard)
    async getUserPackById(@Param('id') id: string): Promise<GenericResponse<ReadUserPackDto>> {
        const userPack = await this.plansService.getUserPackById(+id);
        const userPackResponse = plainToClass(ReadUserPackDto, userPack, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadUserPackDto>(userPackResponse);
    }

    @Patch('user-packs/:id')
    @UseGuards(AdminSessionGuard)
    async updateUserPack(
        @Param('id') id: string,
        @Body() updateUserPackDto: UpdateUserPackDto,
    ): Promise<GenericResponse<ReadUserPackDto>> {
        const userPack = await this.plansService.updateUserPack(+id, updateUserPackDto);
        const userPackResponse = plainToClass(ReadUserPackDto, userPack, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadUserPackDto>(userPackResponse);
    }

    @Delete('user-packs/:id')
    @UseGuards(AdminSessionGuard)
    async deleteUserPack(@Param('id') id: string): Promise<GenericResponse<null>> {
        await this.plansService.deleteUserPack(+id);
        return new GenericResponse<null>(null);
    }
}
