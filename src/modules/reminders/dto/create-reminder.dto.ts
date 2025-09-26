import { IsDate, IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { ReminderTypes } from '../enum/reminder-types.enum';

export class CreateReminderDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(ReminderTypes)
    @IsNotEmpty()
    case: ReminderTypes;

    @IsNotEmpty()
    config: any;

    @IsDate()
    @IsNotEmpty()
    dueDate: Date;
}
