import { IsOptional, IsEnum, IsBoolean } from 'class-validator';

// enums
import { Days } from 'src/shared/enum/days.enum';

import { UpdateWorkingTimeSlotDto } from './update-working-time-slot.dto';

export class UpdateWorkingDayDto {
    @IsOptional()
    @IsEnum(Days)
    day?: Days;

    @IsOptional()
    @IsBoolean()
    isOffDay?: boolean;

    @IsOptional()
    timeSlots?: UpdateWorkingTimeSlotDto[];
}
