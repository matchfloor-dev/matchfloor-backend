import { Expose, Type } from 'class-transformer';
import { Days } from 'src/shared/enum/days.enum';
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
    agencyId: number;
}
