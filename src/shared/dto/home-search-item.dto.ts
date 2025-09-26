import { Expose } from "class-transformer";

export class HomeSearchItemDto {
    @Expose()
    title: string;

    @Expose()
    identifiers: string[];

    @Expose()
    actionUrl: string;
}