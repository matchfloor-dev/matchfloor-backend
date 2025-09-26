import { Expose } from 'class-transformer';

export class ReadWorkingTimeSlotDto {
    @Expose()
    id: number;

    @Expose()
    startTime: number;

    @Expose()
    endTime: number;

    @Expose()
    workingDayId: number;
}
