import { Module } from '@nestjs/common';

// modules
import { AdminsModule } from '../modules/admins/admins.module';

// services
import { InitService } from './init.service';

@Module({
    imports: [AdminsModule],
    providers: [InitService],
    exports: [InitService],
})
export class InitModule {}
