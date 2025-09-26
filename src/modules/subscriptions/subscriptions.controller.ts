import {
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    UseGuards,
} from '@nestjs/common';

// services
import { SubscriptionsService } from './subscriptions.service';

// dto
import { GenericResponse } from 'src/shared/genericResponse.dto';
import { ReadAgencySubscriptionDto } from './dto/read-agency-subscription.dto';
import { plainToClass } from 'class-transformer';
import { AgencySessionGuard } from '../auth/guards/agency-session.guard';

@UseGuards(AgencySessionGuard)
@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) {}

    @Get('agency/:agencyId')
    async getSubscriptions(
        @Param('agencyId', ParseIntPipe) agencyId: number,
    ): Promise<GenericResponse<ReadAgencySubscriptionDto>> {
        const subscription =
            await this.subscriptionsService.getAgencyActiveSubscription(
                agencyId,
            );

        const sub = plainToClass(ReadAgencySubscriptionDto, subscription, {
            excludeExtraneousValues: true,
        });

        return new GenericResponse<ReadAgencySubscriptionDto>(sub);
    }

    @Post('agency/:agencyId/subscribe/plan/:planId')
    async subscribe(
        @Param('agencyId', ParseIntPipe) agencyId: number,
        @Param('planId', ParseIntPipe) planId: number,
    ): Promise<GenericResponse<boolean>> {
        const subscribed = await this.subscriptionsService.subscribe(
            agencyId,
            planId,
        );

        return new GenericResponse<boolean>(subscribed);
    }

    @Delete('agency/:agencyId/unsubscribe/plan/:planId')
    async unsubscribe(
        @Param('agencyId', ParseIntPipe) agencyId: number,
        @Param('planId', ParseIntPipe) planId: number,
    ): Promise<GenericResponse<boolean>> {
        const cancelled = await this.subscriptionsService.unsubscribe(
            agencyId,
            planId,
        );

        return new GenericResponse<boolean>(cancelled);
    }
}
