import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AgentWorkingDaysService } from './working-days.service';
import { WorkingDaysController } from './working-days.controller';

// entities
import { WorkingDays } from './entities/working-day.entity';
import { WorkingTimeSlot } from './entities/working-time-slot.entity';

// modules
import { AgentsModule } from '../../agents.module';
import { AgencyWorkingDaysModule } from 'src/modules/agencies/modules/working-days/working-days.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([WorkingDays, WorkingTimeSlot]),
        forwardRef(() => AgentsModule),
        AgencyWorkingDaysModule,
    ],
    controllers: [WorkingDaysController],
    providers: [AgentWorkingDaysService],
    exports: [AgentWorkingDaysService],
})
export class AgentWorkingDaysModule {}
