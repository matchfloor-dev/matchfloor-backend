import { Expose, Type } from "class-transformer"
import { ReadPlansDto } from "src/modules/plans/dto/read-plans.dto";
import { ReadUserPackDto } from "src/modules/plans/dto/read-user-pack.dto";

export class ReadAgencySubscriptionDto {
    @Expose()
    startDate: number;

    @Expose()
    endDate: number;

    @Expose()
    usedAgents: number;

    @Expose()
    @Type(() => ReadPlansDto)
    plan: ReadPlansDto;
    
    @Expose()
    @Type(() => ReadUserPackDto)
    pack: ReadUserPackDto;
}
