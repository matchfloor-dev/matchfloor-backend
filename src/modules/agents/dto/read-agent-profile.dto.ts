import { Expose, Type } from 'class-transformer';

export class ReadUpdateAgentProfile {
    @Expose()
    firstName: string;

    @Expose()
    lastName: string;
}
