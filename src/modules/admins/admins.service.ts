import {
    BadGatewayException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';

// entities
import { Admin } from './entities/admin.entity';

// dto
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

// interfaces
import { CRUD } from 'src/shared/interfaces/crud.interface';

// services
import { JwtService } from '@nestjs/jwt';

// config
import { envs } from 'src/config/envs.config';

@Injectable()
export class AdminsService implements CRUD<Admin> {
    constructor(
        @InjectRepository(Admin)
        private readonly adminsRepository: Repository<Admin>,
        private readonly jwtService: JwtService,
    ) {}

    async create(
        createAdminDto: CreateAdminDto,
        isSuperAdmin: boolean = false,
    ): Promise<Admin> {
        if (createAdminDto.password !== createAdminDto.passwordConfirmation) {
            throw new BadGatewayException('ERR_PASSWORDS_NOT_MATCH');
        }

        const password = await bcrypt.hash(createAdminDto.password, 10);

        const saveAdmin = {
            ...createAdminDto,
            password,
            isSuperAdmin,
        };

        return await this.adminsRepository.save(saveAdmin);
    }

    async getAll(): Promise<Admin[]> {
        return await this.adminsRepository.find({
            where: { isActive: true, isDeleted: false },
        });
    }

    async getById(id: number, select?: any): Promise<Admin> {
        const defaultSelect = Object.keys(Admin).filter(
            (key) => key !== 'password',
        );
        const selectFields = select || defaultSelect;
        return await this.adminsRepository.findOne({
            where: { id, isActive: true, isDeleted: false },
            select: selectFields,
        });
    }

    async getByEmail(email: string, select?: any): Promise<Admin> {
        const selectFields = select || ['id', 'firstName', 'email'];

        return await this.adminsRepository.findOne({
            where: { email },
            select: selectFields,
        });
    }

    async update(id: number, updateAdminDto: UpdateAdminDto): Promise<Admin> {
        const admin = await this.adminsRepository.findOne({
            where: { id },
        });

        if (!admin) {
            throw new NotFoundException('ERR_ADMIN_NOT_FOUND');
        }

        const updatedAdmin = {
            ...admin,
            ...updateAdminDto,
            updatedAt: new Date(),
        };

        return await this.adminsRepository.save(updatedAdmin);
    }

    async delete(id: number): Promise<void> {
        const admin = await this.adminsRepository.findOne({ where: { id } });

        if (!admin) {
            throw new NotFoundException('ERR_ADMIN_NOT_FOUND');
        }

        if (admin.isSuperAdmin) {
            throw new BadGatewayException('ERR_CANT_DELETE_SUPER_ADMIN');
        }

        await this.adminsRepository.save({ ...admin, isDeleted: true });
    }

    async activate(id: number): Promise<Admin> {
        const admin = await this.adminsRepository.findOne({ where: { id } });

        if (!admin) {
            throw new NotFoundException('ERR_ADMIN_NOT_FOUND');
        }

        return await this.adminsRepository.save({ ...admin, isActive: true });
    }

    /**
     * Creates the login token for the selected user.
     * @param id
     * @returns Promise<string>
     */
    async getAdminLoginToken(id: number): Promise<string> {
        const admin = await this.adminsRepository.findOne({
            where: { id },
            select: ['id', 'email', 'firstName', 'lastName'],
        });

        if (!admin) {
            throw new NotFoundException('ERR_ADMIN_NOT_FOUND');
        }

        const payload = {
            id: admin.id,
            type: 'login',
        };

        const token = await this.jwtService.sign(payload, {
            expiresIn: '30d',
        });

        return `${envs.FRONTEND_URL}/login?token=${token}`;
    }

    /**
     * Loads the default admin, if its not already created.
     * @returns Promise<Admin>
     */

    async loadDefaultAdmin(): Promise<Admin> {
        const defaultAdmin = await this.adminsRepository.findOne({
            where: { isSuperAdmin: true },
        });

        if (defaultAdmin) {
            return defaultAdmin;
        }

        console.log('Loading default admin:');
        console.log(envs.DEFAULT_ADMIN_NAME);
        console.log(envs.DEFAULT_ADMIN_LAST_NAME);
        console.log(envs.DEFAULT_ADMIN_EMAIL);
        console.log(envs.DEFAULT_ADMIN_PASSWORD.substring(0, 8) + '...');

        const admin = {
            firstName: envs.DEFAULT_ADMIN_NAME,
            lastName: envs.DEFAULT_ADMIN_LAST_NAME,
            email: envs.DEFAULT_ADMIN_EMAIL,
            password: envs.DEFAULT_ADMIN_PASSWORD,
            passwordConfirmation: envs.DEFAULT_ADMIN_PASSWORD,
        };

        return this.create(admin, true);
    }
}
