import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v2 as cloudinary } from "cloudinary";
import * as FormData from 'form-data';

// services
import { HttpService } from '@nestjs/axios';

// entities
import { Configuration } from './entities/configuration.entity';
import { Agency } from 'src/modules/agencies/entities/agency.entity';

// dto
import { CreateUpdateConfigurationDto } from './dto/createUpdate-configuration.dto';

// Envs
import { envs } from 'src/config/envs.config';

@Injectable()
export class ConfigurationService {
    constructor(
        @InjectRepository(Configuration)
        private readonly configurationRepository: Repository<Configuration>,
        @InjectRepository(Agency)
        private readonly agencyRepository: Repository<Agency>,

        private httpService: HttpService,
    ) {}

    async create(
        dto: CreateUpdateConfigurationDto,
        agencyId: number,
    ): Promise<Configuration> {
        const agency = await this.agencyRepository.findOne({
            where: { id: agencyId },
        });

        if (!agency) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        // check if configuration already exists
        let config = await this.configurationRepository.findOne({
            where: { agencyId },
        });

        // if not, create a new one
        if (!config) {
            config = this.configurationRepository.create();
            config.agencyId = agency.id;
        }

        if (dto.name) {
            agency.name = dto.name;
            await this.agencyRepository.save(agency);
        }

        // Upload logo image
        if (dto.logoImage) {
            const logoUrl = await this.uploadCloudinaryImage(dto.logoImage);
            config.logoUrl = logoUrl;
        }

        // update configuration
        config.name = dto.name ?? config.name;
        config.primaryColor = dto.primaryColor ?? config.primaryColor;
        config.secondaryColor = dto.secondaryColor ?? config.secondaryColor;
        config.maxScheduleDays =
            dto.maxScheduleDays ?? config.maxScheduleDays ?? 31;
        config.minScheduleDays =
            dto.minScheduleDays ?? config.minScheduleDays ?? 1;

        return await this.configurationRepository.save(config);
    }

    async getConfiguration(agencyId: number): Promise<Configuration> {
        let config = await this.configurationRepository.findOne({
            where: { agencyId },
        });
        if (!config) {
            config = await this.createDefaultConfig(agencyId);
        }
        return config;
    }

    async getSchedulerConfiguration(
        agencyId: number,
    ): Promise<Partial<Configuration>> {
        const config = await this.getConfiguration(agencyId);
        const schedulerConfig = {
            primaryColor: config.primaryColor,
            secondaryColor: config.secondaryColor,
            minScheduleDays: config.minScheduleDays,
            maxScheduleDays: config.maxScheduleDays,
        };
        return schedulerConfig;
    }

    async createDefaultConfig(agencyId: number): Promise<Configuration> {
        const agency = await this.agencyRepository.findOne({
            where: { id: agencyId },
        });

        if (!agency) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        const config = this.configurationRepository.create({
            agencyId,
            name: agency.name,
            primaryColor: '#3c81fc',
            secondaryColor: '#000000',
            maxScheduleDays: 31,
            minScheduleDays: 1,
        });

        return await this.configurationRepository.save(config);
    }

    private async uploadCloudinaryImage(image: Express.Multer.File): Promise<string> {
        try {

            const uploadPreset = envs.CLOUDINARY_UPLOAD_PRESET;
            const apiKey = envs.CLOUDINARY_API_KEY;
            const timestamp = String(Date.now() / 1000 | 0);
            const secret = envs.CLOUDINARY_API_SECRET;
            const cloudName = envs.CLOUDINARY_CLOUD_NAME;
           
            const formData = new FormData();
            formData.append('file', Buffer.from(image.buffer), image.originalname);
            formData.append('upload_preset', uploadPreset);
            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp);

            // Get signture
            const signature = cloudinary.utils.api_sign_request(
                {
                    timestamp,
                    upload_preset: uploadPreset,
                },
                secret,
            );
            formData.append('signature', signature);

            console.log("timestamp: ", timestamp,);
            console.log("uploadPreset: ", uploadPreset);
            console.log('signature: ', signature);

            // POST request to https://api.cloudinary.com/v1_1/{cloudName}/upload
            const response = await this.httpService.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(), 
                    },
                },
            ).toPromise();
    
            return response.data.secure_url;
        } catch (error) {
            console.log('ERROR: ', error.response)
            return "Error uploading image";
            
        }

    }
}