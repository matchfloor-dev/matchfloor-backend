import { Injectable } from '@nestjs/common';

// typeorm
import { LessThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// entities
import { Job } from './entities/job.entity';

// dto
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {

    constructor(
        @InjectRepository(Job)
        private readonly jobRepository: Repository<Job>,
    ) {}

    async createJob(job: CreateJobDto): Promise<Job> {
        return await this.jobRepository.save(job);
    }

    async findExpiredJobs(): Promise<Job[]> {
        return await this.jobRepository.find({
            where: {
                dueDate: LessThan(new Date().getTime()),
                isCompleted: false,
            },
        });
    }

    async updateJob(job: Job): Promise<Job> {
        return await this.jobRepository.save(job);
    }

}
