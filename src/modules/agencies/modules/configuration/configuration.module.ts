import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigurationService } from './configuration.service';
import { ConfigurationController } from './configuration.controller';

// modules
import { HttpModule } from '@nestjs/axios';

// entities
import { Configuration } from './entities/configuration.entity';
import { Agency } from 'src/modules/agencies/entities/agency.entity';
import { AgenciesModule } from '../../agencies.module';

@Module({
    imports: [HttpModule, TypeOrmModule.forFeature([Configuration, Agency]), AgenciesModule],
    controllers: [ConfigurationController],
    providers: [ConfigurationService],
    exports: [ConfigurationService],
})
export class ConfigurationModule {}
