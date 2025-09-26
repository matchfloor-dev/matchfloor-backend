import { IsEnum, IsBoolean } from 'class-validator';

// decorators
import { IsRequired } from 'src/shared/decorators/is-required.decorator';

// enums
import { Days } from 'src/shared/enum/days.enum';

export class CreateWorkingDayDto {
    @IsRequired()
    @IsEnum(Days)
    day: Days;

    @IsRequired()
    @IsBoolean()
    isOffDay: boolean;
}
