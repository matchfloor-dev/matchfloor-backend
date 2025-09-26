import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkingDaysService } from './working-days.service';
import { WorkingDaysController } from './working-days.controller';
import { WorkingDays } from './entities/working-day.entity';
import { WorkingTimeSlot } from './entities/working-time-slot.entity';

@Module({
    imports: [TypeOrmModule.forFeature([WorkingDays, WorkingTimeSlot])],
    controllers: [WorkingDaysController],
    providers: [WorkingDaysService],
    exports: [WorkingDaysService],
})
export class AgencyWorkingDaysModule {}
