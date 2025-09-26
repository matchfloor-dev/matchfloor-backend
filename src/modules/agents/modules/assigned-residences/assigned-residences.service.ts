import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// entities
import { Agent } from '../../entities/agent.entity';
import { Residence } from 'src/modules/residences/entities/residence.entity';

// service
import { AgentWorkingDaysService } from '../working-days/working-days.service';

@Injectable()
export class AssignedResidencesService {
    constructor(
        @InjectRepository(Agent)
        private readonly agentRepository: Repository<Agent>,
        private readonly workingDaysService: AgentWorkingDaysService,
        @InjectRepository(Residence)
        private readonly residencesRepository: Repository<Residence>,
    ) {}

    async getAssignedResidences(agentId: number): Promise<Residence[]> {
        const agent = await this.agentRepository
            .createQueryBuilder('agent')
            .leftJoinAndSelect(
                'agent.residences',
                'residence',
                'residence.isDeleted = :isDeleted',
                { isDeleted: false },
            )
            .where('agent.id = :agentId', { agentId })
            .getOne();

        return agent ? agent.residences : [];
    }

    async findAvailableAgents(
        residenceId: number,
        date: string,
        hour: number,
        duration: number,
    ): Promise<Agent[]> {
        const residence = await this.residencesRepository.findOne({
            where: { id: residenceId, isDeleted: false },
            relations: ['agents'],
        });

        if (!residence) {
            throw new NotFoundException('ERR_RESIDENCE_NOT_FOUND');
        }

        const agents = residence.agents;
        const availableAgents = [];

        for (const agent of agents) {
            if (!agent.isDeleted) {
                const availability =
                    await this.workingDaysService.getAvailability(agent.id);
                if (this.isAgentAvailable(availability, date, hour, duration)) {
                    availableAgents.push(agent);
                }
            }
        }
        return availableAgents;
    }

    private isAgentAvailable(
        availability: any,
        date: string,
        hour: number,
        duration: number,
    ): boolean {
        const dayNumber = this.convertDateToDayNumber(date);
        const dayAvailability = availability[dayNumber];

        if (!dayAvailability) {
            return false;
        }

        // if duration is not setted, set it to 1
        if (!duration) {
            duration = 1;
        }

        for (const slot of dayAvailability) {
            if (slot.startTime <= hour && slot.endTime >= hour + duration) {
                return true;
            }
        }

        return false;
    }

    private convertDateToDayNumber(date: string): number {
        // convert 'dd-mm-yyyy' to Date object
        const [day, month, year] = date.split('-').map(Number);
        const dateObject = new Date(year, month - 1, day);
        // get day number (1 for Sunday, 2 for Monday, etc.)
        return dateObject.getDay() + (1 % 7);
    }
}
