import { IsBoolean, IsEnum } from 'class-validator';
import { Days } from 'src/shared/enum/days.enum';

export class CreateWorkingDayDto {
    @IsEnum(Days)
    day: Days;

    @IsBoolean()
    isOffDay: boolean;
}
