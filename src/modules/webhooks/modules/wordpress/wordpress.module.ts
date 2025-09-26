import { Module } from '@nestjs/common';
import { WordpressService } from './wordpress.service';

// modules
import { ResidencesModule } from 'src/modules/residences/residences.module';
import { AgenciesModule } from 'src/modules/agencies/agencies.module';

@Module({
    providers: [WordpressService],
    exports: [WordpressService],
    imports: [ResidencesModule, AgenciesModule],
})
export class WordpressModule {}
