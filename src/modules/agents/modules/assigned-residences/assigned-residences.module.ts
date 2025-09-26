import { forwardRef, Module } from '@nestjs/common';
import { AssignedResidencesService } from './assigned-residences.service';
import { AssignedResidencesController } from './assigned-residences.controller';

// typeorm
import { TypeOrmModule } from '@nestjs/typeorm';

// entities
import { Agent } from '../../entities/agent.entity';
import { Residence } from 'src/modules/residences/entities/residence.entity';

// modules
import { AgentWorkingDaysModule } from '../working-days/working-days.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Agent, Residence]),
        forwardRef(() => AgentWorkingDaysModule),
    ],
    providers: [AssignedResidencesService],
    controllers: [AssignedResidencesController],
    exports: [AssignedResidencesService],
})
export class AssignedResidencesModule {}
