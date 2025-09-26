import { Expose } from 'class-transformer';

export class ReadConfigurationDto {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    logoUrl: string;

    @Expose()
    primaryColor: string;

    @Expose()
    secondaryColor: string;

    @Expose()
    maxScheduleDays: number;

    @Expose()
    minScheduleDays: number;
}
