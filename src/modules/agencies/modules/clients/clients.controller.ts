import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';

import { plainToClass } from 'class-transformer';

// services
import { ClientsService } from './clients.service';

// dto
import { CreateClientDto } from './dto/create-client.dto';
import { ReadClientDto } from './dto/read-client.dto';
import { GenericResponse } from 'src/shared/genericResponse.dto';

// guards
import { AgentSessionGuard } from '../../../auth/guards/agent-session.guard';

@Controller('clients')
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) {}

    @UseGuards(AgentSessionGuard)
    @Post()
    async create(
        @Body() createClientDto: CreateClientDto,
    ): Promise<GenericResponse<ReadClientDto>> {
        const client = await this.clientsService.create(createClientDto);
        const clientResponse = plainToClass(ReadClientDto, client, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadClientDto>(clientResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Get()
    async getAll(): Promise<GenericResponse<ReadClientDto[]>> {
        const clients = await this.clientsService.getAll();
        const clientsResponse = clients.map((client) =>
            plainToClass(ReadClientDto, client, {
                excludeExtraneousValues: true,
            }),
        );
        return new GenericResponse<ReadClientDto[]>(clientsResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Get(':id')
    async getById(
        @Param('id') id: string,
    ): Promise<GenericResponse<ReadClientDto>> {
        const client = await this.clientsService.getById(parseInt(id));
        const clientResponse = plainToClass(ReadClientDto, client, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<ReadClientDto>(clientResponse);
    }

    @UseGuards(AgentSessionGuard)
    @Delete(':id')
    async delete(@Param('id') id: string): Promise<GenericResponse<null>> {
        await this.clientsService.delete(parseInt(id));
        return new GenericResponse<null>(null);
    }
}
