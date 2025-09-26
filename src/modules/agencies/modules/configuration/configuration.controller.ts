import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';

// services
import { ConfigurationService } from './configuration.service';

// dto
import { CreateUpdateConfigurationDto } from './dto/createUpdate-configuration.dto';
import { ReadConfigurationDto } from './dto/read-configuration.dto';
import { GenericResponse } from 'src/shared/genericResponse.dto';

//guards
import { AgentSessionGuard } from 'src/modules/auth/guards/agent-session.guard';
import { AgencySessionGuard } from 'src/modules/auth/guards/agency-session.guard';
import { WidgetSessionGuard } from 'src/modules/auth/guards/widget-session.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('agencies/:agencyId/configuration')
export class ConfigurationController {
    constructor(private readonly configurationService: ConfigurationService) {}


    // @Post('cloudinary')
    // async uploadImage(
    //     @UploadedFile() file: Express.Multer.File,
    // ): Promise<GenericResponse<string>> {
    //     const result = await this.configurationService.uploadCloudinaryImage(file)
    //     return new GenericResponse<string>(result);
    // }

    @UseGuards(AgencySessionGuard)
    @UseInterceptors(FileInterceptor('logoImage'))
    @Post()
    async createOrUpdate(
        @Body() dto: CreateUpdateConfigurationDto,
        @UploadedFile() logoImage: Express.Multer.File,
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadConfigurationDto>> {
        const configuration = await this.configurationService.create(
            { logoImage, ...dto},
            agencyId,
        );
        return new GenericResponse<ReadConfigurationDto>(configuration);
    }

    @UseGuards(WidgetSessionGuard)
    @Get('/scheduler')
    async getSchedulerConfiguration(
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<Partial<ReadConfigurationDto>>> {
        const schedulerConfig =
            await this.configurationService.getSchedulerConfiguration(agencyId);
        return new GenericResponse<Partial<ReadConfigurationDto>>(
            schedulerConfig,
        );
    }

    @UseGuards(AgentSessionGuard)
    @Get()
    async getConfiguration(
        @Param('agencyId') agencyId: number,
    ): Promise<GenericResponse<ReadConfigurationDto>> {
        const configuration =
            await this.configurationService.getConfiguration(agencyId);
        return new GenericResponse<ReadConfigurationDto>(configuration);
    }
}
