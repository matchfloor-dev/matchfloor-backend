import { Injectable } from '@nestjs/common';
import { Request } from 'express';

// services
import { WordpressService } from './modules/wordpress/wordpress.service';

// enums
import { Webhooks } from './enums/webhooks.enum';

@Injectable()
export class WebhooksService {
    constructor(
        private readonly wordpressService: WordpressService,
    ) {}

    async handleResidencyWebhook(
        data: any,
        webhookType: Webhooks,
        req: Request,
    ): Promise<any> {
        switch (webhookType) {
            case Webhooks.WORDRESS:
                return this.wordpressService.handleResidencesSubmission(
                    data,
                    req,
                );
            default:
                return { message: 'Webhook type not found' };
        }
    }

    
}
