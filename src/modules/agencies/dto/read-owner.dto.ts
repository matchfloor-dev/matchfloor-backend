import { Expose } from "class-transformer";

export class ReadOwnerDto {
    @Expose()
    token: string;
}