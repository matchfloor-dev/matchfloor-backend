import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

// services
import { WebhooksService } from './webhooks.service';

// dto
import { GenericResponse } from 'src/shared/genericResponse.dto';

// enums
import { Webhooks } from './enums/webhooks.enum';

// guards
import { WebhookSessionGuard } from '../auth/guards/webhook-session.guard';

@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly webhooksService: WebhooksService) {}

    @UseGuards(WebhookSessionGuard)
    @Post('/:webhookType/residencies')
    async handleResidencyWebhook(
        @Param('webhookType') webhookType: Webhooks,
        @Body() data: any,
            @Req() req: Request,
    ): Promise<GenericResponse<any>> {
        const response =
            await this.webhooksService.handleResidencyWebhook(data, webhookType, req);
        return new GenericResponse<any>(response);
    }

}
