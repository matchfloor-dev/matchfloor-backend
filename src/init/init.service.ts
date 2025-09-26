import { Injectable, OnModuleInit } from '@nestjs/common';

// services
import { AdminsService } from '../modules/admins/admins.service';

@Injectable()
export class InitService implements OnModuleInit {
    constructor(private readonly adminsService: AdminsService) {}

    async onModuleInit(): Promise<void> {
        await this.adminsService.loadDefaultAdmin();
    }
}
