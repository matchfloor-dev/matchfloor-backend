import { Expose } from 'class-transformer';

export class ReadClientDto {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    phone: string;

    @Expose()
    email: string;
}
