import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
    RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';

// entities
import { SubscriptionPayment } from './entities/subscription-payment.entity';

// services
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { MailsService } from '../mails/mails.service';
import { AgencyNotificationsService } from '../agencies/modules/notifications/notifications.service';

// dtos
import { PaymentCreatedDto } from './dto/payment-created.dto';

// eums
import { PaymentReasons } from './enums/payment-reasons.enum';
import { PaymentTypes } from './enums/payment-types.enum';
// import { PeriodPlan } from '../plans/enum/plans-types.enum';
// import { NotificationType } from '../agencies/modules/notifications/enum/notification-type.enum';

// services
import { StripeService } from './modules/stripe/stripe.service';
// import { envs } from 'src/config/envs.config';
import { AgenciesService } from '../agencies/agencies.service';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(SubscriptionPayment)
        private readonly subscriptionPaymentRepository: Repository<SubscriptionPayment>,

        private readonly subscriptionsService: SubscriptionsService,
        private readonly mailsService: MailsService,
        private readonly agencyNotificationsService: AgencyNotificationsService,

        @Inject(forwardRef(() => StripeService))
        private readonly stripeService: StripeService,

        // @Inject(forwardRef(() => AgenciesService))
        private readonly agenciesService: AgenciesService,
    ) {}

    /**
     * Looks for a pending payment and dispatches the payment creation process to the appropriate service.
     * @param type
     * @param body
     */
    async createSubscriptionPayment(
        type: PaymentTypes,
        agencyId: number,
        subscriptionPaymentId: number,
    ): Promise<PaymentCreatedDto> {
        // 1) Look if the agency has a pending payment of the given type
        const pendingPayment = await this.findPendingPaymentByReason(
            PaymentReasons.SUBSCRIPTION,
            agencyId,
        );

        // get subscription
        const subscription = await this.subscriptionsService.getById(
            pendingPayment.subscriptionId,
        );

        // switch between the payment types
        switch (type) {
            case PaymentTypes.STRIPE:
                return await this.stripeService.createPayment({
                    price: pendingPayment.amount,
                    mode: 'payment',
                    item: {
                        name:
                            'Pago por suscripción plan ' +
                            subscription.plan.name,
                        quantity: 1,
                    },
                    reason: PaymentReasons.SUBSCRIPTION,
                    metadata: {
                        subscriptionPaymentId: subscriptionPaymentId,
                    },
                    currency: subscription.plan.currencyPlan,
                });
            default:
                throw new BadRequestException('ERR_INVALID_PAYMENT_TYPE');
        }
    }

    async findPendingPaymentByReason(
        reason: PaymentReasons,
        agencyId: number,
    ): Promise<SubscriptionPayment> {
        // TODO: por ahora solo funciona el caso de subscription
        if (reason !== PaymentReasons.SUBSCRIPTION) {
            throw new BadRequestException('ERR_INVALID_PAYMENT_REASON');
        }

        console.log('agencyId: ', agencyId);

        // Find the agency active subscription
        const activeSubscription =
            await this.subscriptionsService.getActiveSubscriptionPayments(
                agencyId,
            );

        console.log('activeSubscription: ', activeSubscription);

        // If there is no active subscription, return null
        if (!activeSubscription) return null;

        // Find the pending payment
        const pendingPayment = activeSubscription.payments.find(
            (payment) => !payment.paidAt,
        );

        if (!pendingPayment) {
            throw new NotFoundException('ERR_NO_PENDING_PAYMENT');
        }

        return pendingPayment;
    }

    /**
     * Creates the payments for the subscriptions when the cron job is executed.
     * @deprecated
     */
    // async createSubscriptionPayments() {
    //     const subscriptions = await this.subscriptionsService.getAllActive();
    //     // console.log('subscriptions: ', subscriptions);

    //     subscriptions.forEach(async (subscription) => {
    //         const plan = subscription.plan;
    //         const payments = subscription.payments;
    //         const period = plan.periodPlan;

    //         // If the subscription has no payments, create the first payment
    //         if (!payments.length) {
    //             const payment = new SubscriptionPayment();
    //             payment.amount = plan.price;
    //             payment.startPeriodDate = Number(subscription.startDate);
    //             // If the period is MONTHLY, the end date is one month after the start date
    //             if (period === PeriodPlan.MONTHLY) {
    //                 const a = new Date(Number(subscription.startDate)).setMonth(
    //                     new Date().getMonth() + 1,
    //                 );
    //                 payment.endPeriodDate = new Date(a).getTime();
    //             }

    //             // If the period is ANUALLY, the end date is one year after the start date
    //             if (period === PeriodPlan.ANUALLY) {
    //                 const a = new Date(
    //                     Number(subscription.startDate),
    //                 ).setFullYear(new Date().getFullYear() + 1);
    //                 payment.endPeriodDate = new Date(a).getTime();
    //             }

    //             payment.subscriptionId = subscription.id;
    //             payment.currency = plan.currencyPlan;
    //             payment.description = 'Pago por suscripción plan ' + plan.name;

    //             await this.subscriptionPaymentRepository.save(payment);

    //             // create agency notification
    //             await this.agencyNotificationsService.create({
    //                 agencyId: subscription.agency.id,
    //                 title: 'Pago pendiente',
    //                 body: `Tienes un pago pendiente de $${payment.amount} por la suscripción al plan ${subscription.plan.name}.`,
    //                 type: NotificationType.SYSTEM,
    //                 appointmentId: null,
    //             });

    //             console.log(
    //                 'subscription.agency.email: ',
    //                 subscription.agency.email,
    //             );

    //             // send mail
    //             await this.mailsService.sendPendingPaymentMail({
    //                 to: subscription.agency.email,
    //                 paymentUrl:
    //                     envs.FRONTEND_URL +
    //                     '/agency/new-payment?paymentId=' +
    //                     payment.id,
    //             });

    //             return;
    //         }

    //         // If the subscription has payments, check if the last payment endPeriodDate is less than the current date, if so, create a new payment
    //         // And check if the last payment is paid
    //         const lastPayment = payments.reduce((latest, current) => {
    //             return new Date(current.endPeriodDate) >
    //                 new Date(latest.endPeriodDate)
    //                 ? current
    //                 : latest;
    //         }, payments[0]);
    //         const currentDate = new Date().getTime();

    //         if (
    //             Number(lastPayment.endPeriodDate) < currentDate &&
    //             lastPayment.paidAt
    //         ) {
    //             const payment = new SubscriptionPayment();
    //             payment.amount = plan.price;
    //             payment.startPeriodDate = Number(lastPayment.endPeriodDate);

    //             // If the period is MONTHLY, the end date is one month after the start date
    //             if (period === PeriodPlan.MONTHLY) {
    //                 const a = new Date(
    //                     Number(lastPayment.endPeriodDate),
    //                 ).setMonth(new Date().getMonth() + 1);
    //                 payment.endPeriodDate = new Date(a).getTime();
    //             }

    //             // If the period is ANUALLY, the end date is one year after the start date
    //             if (period === PeriodPlan.ANUALLY) {
    //                 const a = new Date(
    //                     Number(lastPayment.endPeriodDate),
    //                 ).setFullYear(new Date().getFullYear() + 1);
    //                 payment.endPeriodDate = new Date(a).getTime();
    //             }

    //             payment.subscriptionId = subscription.id;
    //             payment.currency = plan.currencyPlan;
    //             payment.description = 'Pago por suscripción plan ' + plan.name;

    //             await this.subscriptionPaymentRepository.save(payment);

    //             // create agency notification
    //             await this.agencyNotificationsService.create({
    //                 agencyId: subscription.agency.id,
    //                 title: 'Pago pendiente',
    //                 body: `Tienes un pago pendiente de $${payment.amount} por la suscripción al plan ${subscription.plan.name}.`,
    //                 type: NotificationType.SYSTEM,
    //                 appointmentId: null,
    //             });

    //             // send mail
    //             await this.mailsService.sendPendingPaymentMail({
    //                 to: subscription.agency.email,
    //                 paymentUrl:
    //                     envs.FRONTEND_URL +
    //                     '/agency/new-payment?paymentId=' +
    //                     payment.id,
    //             });
    //         }
    //     });
    // }

    async webhookHandler(
        payload: any,
        type: PaymentTypes,
        req: RawBodyRequest<Request>,
    ): Promise<boolean> {
        console.log("webhookHandler: ", type);
        switch (type) {
            case PaymentTypes.STRIPE:
                return await this.stripeService.webhookHandler(payload, req);
            default:
                throw new BadRequestException('ERR_INVALID_PAYMENT_TYPE');
        }
    }

    // async saveSubscriptionPayment(
    //     subscriptionPaymentId: number,
    //     paymentId: string,
    //     receiptUrl: string,
    //     paymentMethod: PaymentTypes,
    // ) {
    //     const subscriptionPayment =
    //         await this.subscriptionPaymentRepository.findOne({
    //             where: {
    //                 id: subscriptionPaymentId,
    //             },
    //             relations: ['subscription', 'subscription.agency'],
    //         });

    //     if (!subscriptionPayment) {
    //         throw new NotFoundException('ERR_PAYMENT_NOT_FOUND');
    //     }

    //     subscriptionPayment.paymentMethod = paymentMethod;
    //     subscriptionPayment.paymentId = paymentId;
    //     subscriptionPayment.receiptUrl = receiptUrl;
    //     subscriptionPayment.paidAt = new Date().getTime();

    //     await this.subscriptionPaymentRepository.save(subscriptionPayment);

    //     // Send email to the agency
    //     await this.mailsService.sendPaymentConfirmationMail({
    //         to: subscriptionPayment.subscription.agency.email,
    //         receiptUrl: receiptUrl,
    //     });
    // }

    async getPaymentsByReason(reason: PaymentReasons, agencyId: number) {
        if (reason !== PaymentReasons.SUBSCRIPTION) {
            throw new BadRequestException('ERR_INVALID_PAYMENT_REASON');
        }

        const payments = await this.subscriptionPaymentRepository.find({
            where: {
                subscription: {
                    agency: {
                        id: agencyId,
                    },
                },
            },
        });

        return payments;
    }

    /**
     */
    async createStripeSubscription(sessionId: string): Promise<any> {

        // retrive stripe setup session
        const session = await this.stripeService.retriveSetupIntent(sessionId);

        const paymentMethodId = session.setup_intent.payment_method;
        const customerId = session.setup_intent.customer;

        // 1. get agency with the stripe customer id
        const agency = await this.agenciesService.getAgencyByStripeCustomerId(customerId);

        if(!agency) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        // 2. save payment method id to the agency
        await this.agenciesService.updateAgencyStripePaymentMethod(agency.id, paymentMethodId);

        // 3. create subscription on stripe
        const { subscriptionId } = await this.stripeService.createSubscription(agency.stripeCustomerId, paymentMethodId);

        // 4. Update the stripeSubscriptionId on the subscription
        const subscription = agency.subscriptions[0];

        if(!subscription) {
            throw new NotFoundException('ERR_SUBSCRIPTION_NOT_FOUND');
        }

        subscription.stripeSubscriptionId = subscriptionId;
        await this.subscriptionsService.updateStripeSubscriptionId(subscription.id, subscriptionId);

        // Send welcome email to the agency with api keys
        const { adminKey, widgetKey } = await this.agenciesService.getAgencyApiKeys(agency.id);
        await this.mailsService.sendWelcomeEmail({
            to: agency.email,
            adminKey,
            widgetKey,
        });

        return { subscriptionId };
    }
}
