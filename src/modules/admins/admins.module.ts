import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';

// entities
import { Admin } from './entities/admin.entity';

// modules
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [JwtModule, TypeOrmModule.forFeature([Admin])],
    providers: [AdminsService],
    controllers: [AdminsController],
    exports: [AdminsService],
})
export class AdminsModule {}
