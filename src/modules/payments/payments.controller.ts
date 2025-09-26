import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    RawBodyRequest,
    Req,
    UseGuards,
} from '@nestjs/common';

// services
import { PaymentsService } from './payments.service';

// dto
import { GenericResponse } from 'src/shared/genericResponse.dto';

// guards
import { AgencySessionGuard } from '../auth/guards/agency-session.guard';

// enums
import { PaymentTypes } from './enums/payment-types.enum';

// pipes
import { EnumValidationPipe } from 'src/pipes/enum-validation.pipe';
import { PaymentCreatedDto } from './dto/payment-created.dto';
import { plainToClass } from 'class-transformer';
import { PaymentReasons } from './enums/payment-reasons.enum';
import { Public } from '../auth/decorators/public.decorator';
import { Request } from 'express';

@UseGuards(AgencySessionGuard)
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post(
        'agency/:agencyId/create/subscriptionPayments/:subscriptionPaymentId/:type',
    )
    async createSubscriptionPayment(
        @Param(
            'type',
            new EnumValidationPipe(PaymentTypes, 'ERR_INVALID_PAYMENT_TYPE'),
        )
        type: PaymentTypes,
        @Param('agencyId', ParseIntPipe) agencyId: number,
        @Param('subscriptionPaymentId', ParseIntPipe)
        subscriptionPaymentId: number,
    ): Promise<GenericResponse<PaymentCreatedDto>> {
        const payment = await this.paymentsService.createSubscriptionPayment(
            type,
            agencyId,
            subscriptionPaymentId,
        );
        const paymentCreated = plainToClass(PaymentCreatedDto, payment, {
            excludeExtraneousValues: true,
        });
        return new GenericResponse<PaymentCreatedDto>(paymentCreated);
    }

    @Get('agency/:agencyId/pending/:reason')
    async getPendingPaymentByReason(
        @Param('agencyId', ParseIntPipe) agencyId: number,
        @Param(
            'reason',
            new EnumValidationPipe(PaymentReasons, 'ERR_INVALID_PAYMENT_TYPE'),
        )
        reason: PaymentReasons,
    ): Promise<GenericResponse<any>> {
        const payment = await this.paymentsService.findPendingPaymentByReason(
            reason,
            agencyId,
        );
        return new GenericResponse<any>(payment);
    }

    @Get('agency/:agencyId/:reason')
    async getPaymentsByReason(
        @Param(
            'reason',
            new EnumValidationPipe(
                PaymentReasons,
                'ERR_INVALID_PAYMENT_REASON',
            ),
        )
        reason: PaymentReasons,
        @Param('agencyId', ParseIntPipe) agencyId: number,
    ): Promise<GenericResponse<any>> {
        const payments = await this.paymentsService.getPaymentsByReason(
            reason,
            agencyId,
        );
        return new GenericResponse<any>(payments);
    }

    // Webhook handler
    @Public()
    @Post('webhook/:type')
    async webhookHandler(
        @Req() req: RawBodyRequest<Request>,
        @Body() payload: any,
        @Param(
            'type',
            new EnumValidationPipe(PaymentTypes, 'ERR_INVALID_PAYMENT_TYPE'),
        )
        type: PaymentTypes,
    ) {
        console.log('Webhook received: ');
        await this.paymentsService.webhookHandler(payload, type, req);
        return new GenericResponse<boolean>(true);
    }

    @Public()
    @Post('verify-payment-method')
    async verifyPaymentMethod(
        @Body() data: { sessionId: string },
    ): Promise<GenericResponse<any>> {
        const res = await this.paymentsService.createStripeSubscription(
            data.sessionId,
        );
        return new GenericResponse(res);
    }
}