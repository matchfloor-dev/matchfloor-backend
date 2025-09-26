import { IsNumber, IsOptional } from 'class-validator';

export class UpdateWorkingTimeSlotDto {
    @IsOptional()
    @IsNumber()
    startTime?: number;

    @IsOptional()
    @IsNumber()
    endTime?: number;
}
