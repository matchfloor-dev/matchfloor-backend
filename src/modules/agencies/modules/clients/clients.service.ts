import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

//entities
import { Client } from './entities/client.entity';

//dto
import { CreateClientDto } from './dto/create-client.dto';

//interfaces
import { CRUD } from 'src/shared/interfaces/crud.interface';

@Injectable()
export class ClientsService implements CRUD<Client> {
    constructor(
        @InjectRepository(Client)
        private readonly clientsRepository: Repository<Client>,
    ) {}

    async create(createClientDto: CreateClientDto): Promise<Client> {
        return await this.clientsRepository.save(createClientDto);
    }

    async getAll(): Promise<Client[]> {
        return await this.clientsRepository.find({
            where: { isDeleted: false },
        });
    }

    async getById(id: number): Promise<Client> {
        return await this.clientsRepository.findOne({
            where: { id, isDeleted: false },
        });
    }

    async getByEmail(email: string): Promise<Client> {
        return await this.clientsRepository.findOne({
            where: { email, isDeleted: false },
        });
    }

    async update(id: number, data: Partial<Client>): Promise<Client> {
        const client = await this.getById(id);

        if (!client) {
            throw new NotFoundException('ERR_CLIENT_NOT_FOUND');
        }

        return await this.clientsRepository.save({
            ...client,
            ...data,
        });
    }

    async delete(id: number): Promise<void> {
        const client = await this.getById(id);

        if (!client) {
            throw new NotFoundException('ERR_CLIENT_NOT_FOUND');
        }

        await this.clientsRepository.save({
            ...client,
            isDeleted: true,
        });
    }
}
