import {
    BadRequestException,
    Injectable,
    RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';

// repositories
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// envs
import { envs } from 'src/config/envs.config';

// dto
import { PaymentDetailsDto } from '../../dto/payment-details.dto';
import { PaymentCreatedDto } from '../../dto/payment-created.dto';

// enums
import { CurrencyPlan } from 'src/modules/plans/enum/plans-types.enum';
import { PaymentTypes } from '../../enums/payment-types.enum';

// entities
import { Agency } from 'src/modules/agencies/entities/agency.entity';
import { SubscriptionPayment } from '../../entities/subscription-payment.entity';
import { Plan } from 'src/modules/plans/entities/plan.entity';
import { UserPack } from 'src/modules/plans/entities/user-pack.entity';

// services
import { MailsService } from 'src/modules/mails/mails.service';
import { JobsService } from 'src/modules/jobs/jobs.service';
import { JobTypes } from 'src/modules/jobs/enums/job-types.enum';

@Injectable()
export class StripeService {
    private readonly stripe = new Stripe(envs.stripeSecret);

    constructor(
        @InjectRepository(SubscriptionPayment)
        private readonly subscriptionPaymentRepository: Repository<SubscriptionPayment>,
        @InjectRepository(Agency)
        private readonly agenciesRepository: Repository<Agency>,
        private readonly mailsService: MailsService,
        private readonly jobsService: JobsService,
    ) {}

    /**
     * Creates a payment in stripe.
     * @param paymentDetails
     * @returns
     */
    async createPayment(
        paymentDetails: PaymentDetailsDto,
    ): Promise<PaymentCreatedDto> {
        const stripePayment: Stripe.Checkout.SessionCreateParams = {
            payment_intent_data: {
                metadata: {
                    subscriptionPaymentId:
                        paymentDetails.metadata.subscriptionPaymentId,
                    reason: paymentDetails.reason,
                },
            },
            mode: paymentDetails.mode,
            success_url: envs.stripeSuccessUrl,
            cancel_url: envs.stripeCancelUrl,
            line_items: [
                {
                    price_data: {
                        currency: paymentDetails.currency,
                        product_data: {
                            name: paymentDetails.item.name,
                        },
                        unit_amount: Math.round(paymentDetails.price * 100), // convert to cents
                    },
                    quantity: paymentDetails.item.quantity,
                },
            ],
        };

        // If it's a free trial
        if (paymentDetails.freeTrial) {
            stripePayment.subscription_data = {
                // trial_period_days: 14,
                trial_end: new Date().getTime() + 1000 * 60 * 10, // TEST 10 minutes
            };
        }

        // Create the payment
        const payment =
            await this.stripe.checkout.sessions.create(stripePayment);

        return { url: payment.url };
    }

    /**
     * Handles the webhook from stripe.
     * @param payload
     */
    async webhookHandler(
        payload: any,
        req: RawBodyRequest<Request>,
    ): Promise<boolean> {
        const sig = req.headers['stripe-signature'];
        console.log('STRIPE SIGNATURE: ', sig);

        let event: Stripe.Event;
        const endpointSecret = envs.stripeEndpointSecret;

        try {
            event = this.stripe.webhooks.constructEvent(
                req.rawBody?.toString(),
                sig,
                endpointSecret,
            );
        } catch (err) {
            console.error(err);
            throw new BadRequestException(`Webhook Error: ${err.message}`);
        }

        /**
         * This switch is to handle the different events that stripe sends.
         * Is ordered in the same way that the events are triggered (or we hope so),
         * when a subscription is charged, first the invoice is created, then the payment is succeeded.
         * Typically Stripe waits an hour to charge the customer once the invoice is created.
         */
        switch (event.type) {
            /**
             * (1) First we listen to the creation of the invoice. We create the payment (subscription_payment) on the database.
             */
            case 'invoice.created':
                const invoice = event.data.object;
                console.log('INVOICE CREATED: ', invoice);

                // Get the agency subscrition to get the subscription id
                const ag = await this.agenciesRepository.findOne({
                    where: { stripeCustomerId: String(invoice.customer) },
                    relations: ['subscriptions'],
                });
                if (!ag) {
                    throw new BadRequestException('ERR_AGENCY_NOT_FOUND');
                }

                const subscription = ag.subscriptions[0];
                if (!subscription) {
                    throw new BadRequestException('ERR_SUBSCRIPTION_NOT_FOUND');
                }
                console.log('SUBSCRIPTION FOUND: ', subscription);

                // Period information
                const periodStart = invoice.lines.data[0].period.start;
                const periodEnd = invoice.lines.data[0].period.end;

                // Create the subscription payment
                await this.subscriptionPaymentRepository.save({
                    subscriptionId: subscription.id,
                    currency: invoice.currency as CurrencyPlan,
                    amount: invoice.amount_due / 100,
                    paymentMethod: PaymentTypes.STRIPE,
                    invoiceId: invoice.id,
                    description: 'Subscription payment',
                    startPeriodDate: periodStart * 1000,
                    endPeriodDate: periodEnd * 1000,
                    paidAt: null,
                });

                // TODO: testtttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt
                // IDEA: Here we can dispatch a job to be exceuted in 1 day. The job will check if the payment was made.
                // If not, we disable the agency and send a email to the agency.
                // dispatchJob('verifyPayment', 11111111111111, { subscriptionPaymentId: subscriptionPayment.id });
                await this.jobsService.createJob({
                    name: 'Verify payment for agency ' + ag.id,
                    case: JobTypes.VERIFY_PAYMENT,
                    config: {
                        subscriptionPaymentId: subscription.id,
                    },
                    dueDate: new Date().getTime() + 1000 * 60 * 60 * 24, // 1 day
                });

                break;

            /**
             * (2) Then we listen to the payment of the invoice. We update the payment (subscription_payment) on the database.
             */
            case 'invoice.paid':
                const inv = event.data.object;
                const customerId = inv.customer;
                const receiptUrl = inv.invoice_pdf;
                const hostedInvoiceUrl = inv.hosted_invoice_url;
                const paymentIntentId = inv.payment_intent;
                const invoiceNumber = inv.number;
                const recepitNumber = inv.receipt_number; // este esta null por alguna razon en stripe

                // get the subscription payment
                const subscriptionPayment =
                    await this.subscriptionPaymentRepository.findOne({
                        where: { invoiceId: inv.id },
                    });

                // update the subscription payment
                subscriptionPayment.paidAt = inv.effective_at;
                subscriptionPayment.paymentIntentId = String(paymentIntentId);
                subscriptionPayment.invoiceNumber = invoiceNumber;
                subscriptionPayment.recepitNumber = recepitNumber;
                subscriptionPayment.receiptUrl = receiptUrl;
                subscriptionPayment.hostedInvoiceUrl = hostedInvoiceUrl;

                // subscriptionPayment.endPeriodDate = invoice.period_end;
                await this.subscriptionPaymentRepository.save(
                    subscriptionPayment,
                );

                // Get agency
                const agency = await this.agenciesRepository.findOne({
                    where: { stripeCustomerId: String(customerId) },
                });

                if (agency) {
                    // send confirmation email
                    this.mailsService.sendSubscriptionPaymentConfirmation({
                        to: agency.email,
                        paymentUrl: hostedInvoiceUrl,
                    });
                }

                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        console.log('Stripe webhook handled returning...');
        return true;
    }

    /**
     * Creates the customer adn generates the url for the checkout session, to get the card details.
     * @param createSubscription
     */
    async createCardCheckoutSession(agency: Agency): Promise<{
        customerId: string;
        url: string;
    }> {
        console.log(
            'STRIPE CREATE CARD CHECKOUT SESSION -------------------------- ',
        );

        // Create the customer
        const customer = await this.stripe.customers.create({
            email: agency.email,
            name: agency.name,
        });
        console.log('STRIPE CREATED CUSTOMER: ', customer);

        // Create the checkout session
        const session = await this.stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            mode: 'setup',
            success_url: envs.stripeSuccessUrl,
            // 'https://altacharla.store/stripe/checkout-session/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: envs.stripeCancelUrl,
            // 'https://altacharla.store/stripe/checkout-session/cancel',
            custom_text: {
                submit: {
                    message:
                        'No se te cobrará ahora. Disfrutarás de 15 días de prueba gratuita. Después de este período, se realizará el cargo automáticamente.',
                },
            },
        });

        return {
            customerId: customer.id,
            url: session.url,
        };
    }

    /**
     * Creates a customer and a subscription in stripe.
     */
    async createSubscription(
        customerId: string,
        paymentMethodId: string,
    ): Promise<{
        subscriptionId: string;
    }> {
        // 1) Assign the payment method to the customer
        await this.stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });

        // 2) Set the payment method as the default for the customer
        await this.stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        // Get the agency plan
        const agency = await this.agenciesRepository.findOne({
            where: { stripeCustomerId: customerId },
            relations: ['subscriptions.plan', 'subscriptions.pack'],
        });
        if (!agency) {
            throw new BadRequestException('ERR_AGENCY_NOT_FOUND');
        }

        const subscription = agency.subscriptions[0];
        // Get the plan
        const plan = subscription.plan;

        // Determine which price ID to use based on the subscription period
        // By default, use monthly subscription (this can be adjusted based on business logic)
        const planPriceId = plan.monthlyStripePriceId;

        if (!planPriceId) {
            throw new BadRequestException('ERR_PRICE_NOT_FOUND');
        }

        // Prepare subscription items array (starting with the plan)
        const subscriptionItems = [
            {
                price: planPriceId,
            },
        ];

        // Check if the subscription has a user pack
        const hasPack = subscription.pack && subscription.packId;

        // If there's a pack, add it to the subscription items
        if (hasPack) {
            const pack = subscription.pack;

            // Use monthly price ID for the pack
            const packPriceId = pack.monthlyStripePriceId;

            if (!packPriceId) {
                throw new BadRequestException('ERR_PACK_PRICE_NOT_FOUND');
            }

            // Add the pack to the subscription items
            subscriptionItems.push({
                price: packPriceId,
            });
        }

        // Set trial period based on whether there's a pack
        const trialPeriod = Math.floor(Date.now() / 1000 + 15 * 24 * 60 * 60); // 15 days trial

        // Create the subscription
        const stripeSubscription = await this.stripe.subscriptions.create({
            customer: customerId,
            items: subscriptionItems,
            trial_end: trialPeriod,
            default_payment_method: paymentMethodId,
            collection_method: 'charge_automatically',
            expand: ['latest_invoice.payment_intent'],
        });

        // Save the subscription
        return {
            subscriptionId: stripeSubscription.id,
        };
    }

    async retriveSetupIntent(sessionId: string): Promise<any> {
        return await this.stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['setup_intent'],
        });
    }

    /**
     * Creates a plan product in stripe.
     * @param plan
     * @returns { productId, priceId }
     */
    async createPlanProduct(plan: Plan): Promise<{
        productId: string;
        monthlyPriceId: string;
        annualPriceId: string;
    }> {
        // Create the product
        const product = await this.stripe.products.create({
            name: plan.name,
            description: plan.description,
            metadata: {
                planId: plan.id.toString(),
            },
        });

        // Create monthly price
        const monthlyPrice = await this.stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(plan.monthlyPrice * 100), // convert to cents
            currency: plan.currencyPlan.toLowerCase(),
            recurring: {
                interval: 'month',
            },
        });

        // Create annual price
        const annualPrice = await this.stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(plan.annualPrice * 100), // convert to cents
            currency: plan.currencyPlan.toLowerCase(),
            recurring: {
                interval: 'year',
            },
        });

        return {
            productId: product.id,
            monthlyPriceId: monthlyPrice.id,
            annualPriceId: annualPrice.id,
        };
    }

    async updatePlanProduct(plan: Plan): Promise<{
        productId: string;
        monthlyPriceId: string;
        annualPriceId: string;
    }> {
        // Update the product
        const product = await this.stripe.products.update(
            plan.stripeProductId,
            {
                name: plan.name,
                description: plan.description,
                metadata: {
                    planId: plan.id.toString(),
                },
            },
        );

        // Archive old prices
        if (plan.monthlyStripePriceId) {
            await this.stripe.prices.update(plan.monthlyStripePriceId, {
                active: false,
            });
        }

        if (plan.annualStripePriceId) {
            await this.stripe.prices.update(plan.annualStripePriceId, {
                active: false,
            });
        }

        // Create new prices
        const monthlyPrice = await this.stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(plan.monthlyPrice * 100), // convert to cents
            currency: plan.currencyPlan.toLowerCase(),
            recurring: {
                interval: 'month',
            },
        });

        const annualPrice = await this.stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(plan.annualPrice * 100), // convert to cents
            currency: plan.currencyPlan.toLowerCase(),
            recurring: {
                interval: 'year',
            },
        });

        return {
            productId: product.id,
            monthlyPriceId: monthlyPrice.id,
            annualPriceId: annualPrice.id,
        };
    }

    /**
     * Creates a user pack product in Stripe with both monthly and annual prices
     * @param userPack
     * @returns
     */
    async createUserPackProduct(userPack: UserPack): Promise<{
        productId: string;
        monthlyPriceId: string;
        annualPriceId: string;
    }> {
        // Create the product
        const product = await this.stripe.products.create({
            name: userPack.name,
            description: userPack.description,
        });

        // Create monthly price
        const monthlyPrice = await this.stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(userPack.monthlyPrice * 100), // convert to cents
            currency: userPack.currencyPlan.toLowerCase(),
            recurring: {
                interval: 'month',
            },
        });

        // Create annual price
        const annualPrice = await this.stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(userPack.annualPrice * 100), // convert to cents
            currency: userPack.currencyPlan.toLowerCase(),
            recurring: {
                interval: 'year',
            },
        });

        return {
            productId: product.id,
            monthlyPriceId: monthlyPrice.id,
            annualPriceId: annualPrice.id,
        };
    }

    async updateUserPackProduct(userPack: UserPack): Promise<{
        productId: string;
        monthlyPriceId: string;
        annualPriceId: string;
    }> {
        // Update the product
        const product = await this.stripe.products.update(
            userPack.stripeProductId,
            {
                name: userPack.name,
                description: userPack.description,
                metadata: {
                    userPackId: userPack.id.toString(),
                    userCount: userPack.userCount.toString(),
                },
            },
        );

        // Archive old prices
        if (userPack.monthlyStripePriceId) {
            await this.stripe.prices.update(userPack.monthlyStripePriceId, {
                active: false,
            });
        }

        if (userPack.annualStripePriceId) {
            await this.stripe.prices.update(userPack.annualStripePriceId, {
                active: false,
            });
        }

        // Create new monthly price
        const monthlyPrice = await this.stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(userPack.monthlyPrice * 100), // convert to cents
            currency: userPack.currencyPlan.toLowerCase(),
            recurring: {
                interval: 'month',
            },
        });

        // Create new annual price
        const annualPrice = await this.stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(userPack.annualPrice * 100), // convert to cents
            currency: userPack.currencyPlan.toLowerCase(),
            recurring: {
                interval: 'year',
            },
        });

        return {
            productId: product.id,
            monthlyPriceId: monthlyPrice.id,
            annualPriceId: annualPrice.id,
        };
    }

    /**
     * Cancels a subscription in Stripe.
     * @param subscriptionId The Stripe subscription ID to cancel
     * @returns The canceled subscription object with period end information
     */
    async cancelSubscription(subscriptionId: string): Promise<{
        canceled: boolean;
        subscriptionStatus: string;
        periodEndDate: number;
    }> {
        try {
            // Cancel the subscription at period end to avoid prorated charges
            const subscription = await this.stripe.subscriptions.update(
                subscriptionId,
                { cancel_at_period_end: true },
            );

            // Get the period end timestamp and convert to Date
            const periodEnd = subscription.current_period_end;
            const periodEndDate = new Date(periodEnd * 1000).getTime(); // Convert from Unix timestamp (seconds) to milliseconds

            return {
                canceled: true,
                subscriptionStatus: subscription.status,
                periodEndDate: periodEndDate,
            };
        } catch (error) {
            console.error('Error canceling subscription:', error);
            throw new BadRequestException(
                `Failed to cancel subscription: ${error.message}`,
            );
        }
    }
}
