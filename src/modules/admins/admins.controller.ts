import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    UseGuards,
} from '@nestjs/common';

import { plainToClass } from 'class-transformer';

// services
import { AdminsService } from './admins.service';

// dto
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ReadAdminDto } from './dto/read-admin.dto';
import { GenericResponse } from 'src/shared/genericResponse.dto';

// guards
import { AdminSessionGuard } from '../auth/guards/admin-session.guard';

@UseGuards(AdminSessionGuard)
@Controller('admins')
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) {}

    @Post()
    async create(
        @Body() createAdminDto: CreateAdminDto,
    ): Promise<GenericResponse<ReadAdminDto>> {
        const admin = await this.adminsService.create(createAdminDto);
        const adminResponse = plainToClass(ReadAdminDto, admin, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadAdminDto>(adminResponse);
    }

    @Get()
    async getAll(): Promise<GenericResponse<ReadAdminDto[]>> {
        const admins = await this.adminsService.getAll();
        const adminsResponse = admins.map((admin) =>
            plainToClass(ReadAdminDto, admin, {
                excludeExtraneousValues: true,
            }),
        );
        return new GenericResponse<ReadAdminDto[]>(adminsResponse);
    }

    @Get(':id')
    async getById(
        @Param('id') id: string,
    ): Promise<GenericResponse<ReadAdminDto>> {
        const admin = await this.adminsService.getById(parseInt(id));
        const adminResponse = plainToClass(ReadAdminDto, admin, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadAdminDto>(adminResponse);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateAdminDto: UpdateAdminDto,
    ): Promise<GenericResponse<ReadAdminDto>> {
        const admin = await this.adminsService.update(
            parseInt(id),
            updateAdminDto,
        );
        const adminResponse = plainToClass(ReadAdminDto, admin, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadAdminDto>(adminResponse);
    }

    @Put(':id/activate')
    async activate(@Param('id') id: string): Promise<GenericResponse<null>> {
        await this.adminsService.activate(parseInt(id));
        return new GenericResponse<null>(null);
    }
}
