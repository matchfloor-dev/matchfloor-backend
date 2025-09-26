import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Services
import { RemindersService } from './reminders.service';

// Entities
import { Reminder } from './entities/reminder.entity';

// Modules
import { AgenciesModule } from '../agencies/agencies.module';
import { MailsModule } from '../mails/mails.module';
import { ResidencesModule } from '../residences/residences.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Reminder]),
        AgenciesModule,
        MailsModule,
        ResidencesModule,
        forwardRef(() => AgentsModule),
    ],
    providers: [RemindersService],
    exports: [RemindersService],
})
export class RemindersModule {}
