import { JobTypes } from "../enums/job-types.enum";

export class CreateJobDto {
    name: string;
    case: JobTypes;
    config: any;
    dueDate: number;
}