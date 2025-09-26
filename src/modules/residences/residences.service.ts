import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

// entities
import { Residence } from './entities/residence.entity';
import { Agent } from '../agents/entities/agent.entity';

// dto
import { CreateResidenceDto } from './dto/create-residence.dto';
import { UpdateResidenceDto } from './dto/update-residence.dto';

// interfaces
import { CRUD } from 'src/shared/interfaces/crud.interface';

@Injectable()
export class ResidencesService implements CRUD<Residence> {
    constructor(
        @InjectRepository(Residence)
        private readonly residencesRepository: Repository<Residence>,
        @InjectRepository(Agent)
        private readonly agentsRepository: Repository<Agent>,
    ) {}

    async create(
        createResidenceDto: CreateResidenceDto,
        agencyId: number,
    ): Promise<Residence> {
        let agents = [];

        if (createResidenceDto.allAgents) {
            agents = await this.agentsRepository.find({
                where: { isActive: true, isDeleted: false, agencyId },
            });

            if (agents.length === 0) {
                throw new NotFoundException('ERR_NO_AGENTS_AVAILABLE');
            }
        } else {
            const { agentsIds } = createResidenceDto;

            agents = await this.agentsRepository.find({
                where: {
                    id: In(agentsIds),
                    isActive: true,
                    isDeleted: false,
                    agencyId,
                },
            });

            if (agents.length === 0) {
                throw new NotFoundException('ERR_NO_AGENTS_SELECTED');
            }

            if (agents.length !== agentsIds.length) {
                throw new NotFoundException('ERR_AGENT_NOT_FOUND');
            }
        }

        const saveResidence = {
            ...createResidenceDto,
            agents,
        };

        return await this.residencesRepository.save(saveResidence);
    }

    async getAll(agencyId: number): Promise<Residence[]> {
        const residences = await this.residencesRepository
            .createQueryBuilder('residence')
            .leftJoinAndSelect('residence.agents', 'agents')
            .where('residence.isDeleted = false')
            .andWhere('agents.agencyId = :agencyId', { agencyId })
            .andWhere('agents.isDeleted = false')
            .getMany();

        return residences;
    }

    async getAllResidencesAppointments(agencyId: number): Promise<Residence[]> {
        const residence = await this.residencesRepository
            .createQueryBuilder('residence')
            .leftJoinAndSelect('residence.agents', 'agents')
            .leftJoinAndSelect('residence.appointments', 'appointments')
            .where('residence.isDeleted = false')
            .andWhere('agents.agencyId = :agencyId', { agencyId })
            .andWhere('agents.isDeleted = false')
            .getMany();

        return residence;
    }

    async getById(id: number, agencyId: number): Promise<Residence> {
        const residence = await this.residencesRepository
            .createQueryBuilder('residence')
            .leftJoinAndSelect('residence.agents', 'agents')
            .where('residence.id = :id', { id })
            .andWhere('residence.isDeleted = false')
            .andWhere('agents.agencyId = :agencyId', { agencyId })
            .andWhere('agents.isDeleted = false')
            .getOne();

        if (!residence) {
            throw new NotFoundException('ERR_RESIDENCE_NOT_FOUND');
        }

        return residence;
    }

    async getByAllAgentsTrue(agencyId: number): Promise<Residence[]> {
        const residences = await this.residencesRepository
            .createQueryBuilder('residence')
            .leftJoinAndSelect('residence.agents', 'agents')
            .where('residence.isDeleted = false')
            .andWhere('agents.agencyId = :agencyId', { agencyId })
            .andWhere('agents.isDeleted = false')
            .andWhere('residence.allAgents = true')
            .getMany();

        return residences;
    }

    async update(
        id: number,
        updateResidenceDto: UpdateResidenceDto,
        agencyId: number,
    ): Promise<Residence> {
        const residence = await this.residencesRepository.findOne({
            where: { id },
        });

        if (!residence) {
            throw new NotFoundException('ERR_RESIDENCE_NOT_FOUND');
        }

        if (updateResidenceDto.allAgents) {
            const agents = await this.agentsRepository.find({
                where: { isActive: true, isDeleted: false, agencyId },
            });

            if (agents.length === 0) {
                throw new NotFoundException('ERR_AGENT_NOT_FOUND');
            }

            residence.agents = agents;
        } else {
            const { agentsIds } = updateResidenceDto;

            if (agentsIds && agentsIds.length > 0) {
                const agents = await this.agentsRepository.find({
                    where: {
                        id: In(agentsIds),
                        isActive: true,
                        isDeleted: false,
                        agencyId,
                    },
                });

                if (agents.length !== agentsIds.length) {
                    throw new NotFoundException('ERR_AGENT_NOT_FOUND');
                }

                residence.agents = agents;
            }
        }

        const saveResidence = {
            ...residence,
            ...updateResidenceDto,
            updatedAt: new Date(),
        };

        return await this.residencesRepository.save(saveResidence);
    }

    async delete(id: number): Promise<void> {
        const residence = await this.residencesRepository.findOne({
            where: { id },
        });

        if (!residence) {
            throw new NotFoundException('ERR_RESIDENCE_NOT_FOUND');
        }

        await this.residencesRepository.save({
            ...residence,
            isDeleted: true,
        });
    }

    async getResidencesByIdentifier(
        ids: string,
        agencyId: number,
    ): Promise<Residence[]> {
        if (!ids) {
            throw new BadRequestException('ERR_NO_IDENTIFIERS_PROVIDED');
        }

        // Get all the residences of the agency
        const residences = await this.getAll(agencyId);

        // find the residences in wich the ids (ex. https://inmob.shop/?property=penthouse-apartment) includes any of the identifiers[]
        // from the residence.
        const filteredResidences = residences.filter((residence) => {
            if (!residence.identifiers) return false;
            let found = false;
            residence.identifiers.forEach((identifier) => {
                if (
                    ids
                        .toLocaleLowerCase()
                        .includes(identifier.toLocaleLowerCase())
                ) {
                    found = true;
                }
            });
            return found;
        });

        return filteredResidences.length > 0 ? filteredResidences : residences;
    }
}
