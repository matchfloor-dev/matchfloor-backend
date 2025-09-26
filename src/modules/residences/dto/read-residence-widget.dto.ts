import { Expose } from "class-transformer";

export class ReadResidenceWidgetDto {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    ownerEmail: string;
}