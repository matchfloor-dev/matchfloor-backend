import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

import { envs } from 'src/config/envs.config';

export const databaseProviders = [
    TypeOrmModule.forRootAsync({
        async useFactory() {
            return {
                type: 'mysql' as const,
                host: envs.DB_HOST,
                username: envs.DB_USER,
                port: envs.DB_PORT,
                database: envs.DB_NAME,
                password: envs.DB_PASSWORD,
                entities: [__dirname + '/../**/*.entity.{js,ts}'],
                synchronize: true,
                migrations: [__dirname + '../../db/migrations/*{.ts,.js}'],
                // subscribers: [__dirname + '/../**/*.subscriber.{js,ts}'],
                // logging: ['query', 'error'],
            } as DataSourceOptions;
        },
    }),
];
