import { Expose } from 'class-transformer';

export class PrescriptorResponseDto {
    @Expose()
    id: number;

    @Expose()
    email: string;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    phoneNumber: string;

    @Expose()
    referenceCode: string;

    @Expose()
    isVerified: boolean;

    @Expose()
    isActive: boolean;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
} 