import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ResidencesService } from './residences.service';
import { ResidencesController } from './residences.controller';

// entities
import { Residence } from './entities/residence.entity';
import { Agent } from '../agents/entities/agent.entity';
import { AgenciesModule } from '../agencies/agencies.module';

@Module({
    imports: [TypeOrmModule.forFeature([Residence, Agent]), forwardRef(() => AgenciesModule)],
    controllers: [ResidencesController],
    providers: [ResidencesService],
    exports: [ResidencesService],
})
export class ResidencesModule {}
