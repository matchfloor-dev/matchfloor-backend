import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';

// modules
import { WordpressModule } from './modules/wordpress/wordpress.module';
import { AgenciesModule } from '../agencies/agencies.module';

@Module({
  providers: [WebhooksService],
  controllers: [WebhooksController],
  imports: [WordpressModule, AgenciesModule],
})
export class WebhooksModule {}
