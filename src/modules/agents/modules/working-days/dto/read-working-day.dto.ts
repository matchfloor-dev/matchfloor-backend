import { Expose, Type } from 'class-transformer';

// enums
import { Days } from 'src/shared/enum/days.enum';

// DTOs
import { ReadWorkingTimeSlotDto } from './read-working-time-slot.dto';

export class ReadWorkingDayDto {
    @Expose()
    id: number;

    @Expose()
    day: Days;

    @Expose()
    isOffDay: boolean;

    @Expose()
    @Type(() => ReadWorkingTimeSlotDto)
    timeSlots: ReadWorkingTimeSlotDto[];

    @Expose()
    agentId: number;
}
