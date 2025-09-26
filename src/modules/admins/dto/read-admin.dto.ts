import { Expose } from 'class-transformer';

export class ReadAdminDto {
    @Expose()
    id: number;

    @Expose()
    email: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    isActive: boolean;

    @Expose()
    isSuperAdmin: boolean;
}
