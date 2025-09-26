import { PartialType } from "@nestjs/mapped-types";

import { ReadAgentDto } from "./read-agent.dto";
import { Expose } from "class-transformer";

export class ReadAgentForAgencyDto extends PartialType(ReadAgentDto) {

    @Expose()
    loginUrl: string;

}