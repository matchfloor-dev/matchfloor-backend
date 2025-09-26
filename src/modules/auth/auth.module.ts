import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

// modules
import { JwtModule } from '@nestjs/jwt';
import { AdminsModule } from '../admins/admins.module';
import { AgenciesModule } from '../agencies/agencies.module';
import { AgentsModule } from '../agents/agents.module';
import { ConfigurationModule } from '../agencies/modules/configuration/configuration.module';
import { PrescriptorsModule } from '../prescriptors/prescriptors.module';

import { envs } from 'src/config/envs.config';

@Module({
    imports: [
        AdminsModule,
        AgenciesModule,
        AgentsModule,
        PrescriptorsModule,
        JwtModule.register({
            global: true,
            secret: envs.JWT_SECRET,
            signOptions: { expiresIn: '3d' },
        }),
        ConfigurationModule,
    ],
    providers: [AuthService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
