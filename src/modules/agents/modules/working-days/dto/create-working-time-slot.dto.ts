import { IsNumber } from 'class-validator';

export class CreateWorkingTimeSlotDto {
    @IsNumber()
    startTime: number;

    @IsNumber()
    endTime: number;
}
