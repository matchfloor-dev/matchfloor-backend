import { IsNull, Repository, Not } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

// entities
import { Subscription } from './entities/subscriptions.entity';
import { Agency } from '../agencies/entities/agency.entity';
import { UserPack } from '../plans/entities/user-pack.entity';

// services
import { AgenciesService } from '../agencies/agencies.service';
import { PlansService } from '../plans/plans.service';
import { ReadAgencySubscriptionDto } from './dto/read-agency-subscription.dto';
import { plainToClass } from 'class-transformer';
import { SubscriptionPayment } from '../payments/entities/subscription-payment.entity';
import { StripeService } from '../payments/modules/stripe/stripe.service';

@Injectable()
export class SubscriptionsService {
    constructor(
        @InjectRepository(Subscription)
        private readonly subscriptionsRepository: Repository<Subscription>,

        @InjectRepository(SubscriptionPayment)
        private readonly subscriptionPaymentsRepository: Repository<SubscriptionPayment>,

        @InjectRepository(UserPack)
        private readonly userPacksRepository: Repository<UserPack>,

        @Inject(forwardRef(() => AgenciesService))
        private readonly agenciesService: AgenciesService,

        @Inject(forwardRef(() => PlansService))
        private readonly plansService: PlansService,

        @Inject(forwardRef(() => StripeService))
        private readonly stripeService: StripeService,
    ) {}

    private async validateIds(
        agencyId: number,
        planId: number,
    ): Promise<{
        agency: Agency;
    }> {
        // fetch agency
        const agency = await this.agenciesService.getById(agencyId);

        if (!agency) {
            throw new NotFoundException('ERR_AGENCY_NOT_FOUND');
        }

        // remove deleted agents
        agency.agents = agency.agents?.filter(
            (agent) => !agent.isDeleted && agent.isActive,
        );

        // fetch plan
        await this.plansService.getPlanById(planId);

        return {
            agency,
        };
    }

    async getById(id: number): Promise<Subscription> {
        const subscription = await this.subscriptionsRepository.findOne({
            where: {
                id: id,
            },
            relations: ['agency', 'plan'],
        });

        if (!subscription) {
            throw new NotFoundException('ERR_SUBSCRIPTION_NOT_FOUND');
        }

        return subscription;
    }

    async subscribe(
        agencyId: number,
        planId: number,
        useFreeTrial: boolean = false,
    ): Promise<boolean> {
        // Validate Ids
        const { agency } = await this.validateIds(agencyId, planId);

        // TODO: validate that if a agency already has a subscription, it can't use the free trial although it has not used it
        if (useFreeTrial && agency.usedFreeTrial) {
            throw new BadRequestException('ERR_FREE_TRIAL_ALREADY_USED');
        }

        // Check if the agency can support the current number of agents
        // This check needs to be updated to match the new plan structure
        const validSubscription = await this.validateSubscription(agency);

        if (!validSubscription) {
            throw new NotFoundException('ERR_AGENT_LIMIT_EXCEEDED');
        }

        // verify if agency is already subscribed to a plan
        const subscription = await this.subscriptionsRepository.findOne({
            where: {
                agencyId: agencyId,
                endDate: IsNull(),
            },
        });

        // If so, end subscription
        if (subscription) {
            // If the plan is the same, return
            if (subscription.planId === planId) {
                throw new BadRequestException('ERR_ALREADY_SUBSCRIBED');
            }

            // update end date
            subscription.endDate = new Date().getTime();
            await this.subscriptionsRepository.save(subscription);
        }

        // create new subscription
        const newSubscription = {
            agencyId,
            planId,
            startDate: new Date().getTime(),
            endDate: null,
            // franco: agregar un camp aca qe indique si estas suscripcion se inicio con prueba gratis y de ahi controlar el estado
        };

        await this.subscriptionsRepository.save(newSubscription);

        return true;
    }

    async updateStripeSubscriptionId(
        subscriptionId: number,
        stripeSubscriptionId: string,
    ): Promise<boolean> {
        const subscription = await this.getById(subscriptionId);

        subscription.stripeSubscriptionId = stripeSubscriptionId;
        await this.subscriptionsRepository.save(subscription);

        return true;
    }

    async unsubscribe(agencyId: number, planId: number): Promise<boolean> {
        // Validate Ids
        await this.validateIds(agencyId, planId);

        // Verify if agency has an active subscription to this plan
        // Active means: endDate is null OR endDate is in the future
        const subscription = await this.subscriptionsRepository.findOne({
            where: [
                {
                    agencyId: agencyId,
                    planId: planId,
                    endDate: IsNull(),
                },
            ],
        });

        // Check if we found a subscription and if it's active
        if (!subscription) {
            throw new NotFoundException('ERR_SUBSCRIPTION_NOT_FOUND');
        }

        // Check if subscription has Stripe subscription ID
        if (!subscription.stripeSubscriptionId) {
            // If no Stripe subscription (unlikely), just end the subscription now
            subscription.endDate = new Date().getTime();
            await this.subscriptionsRepository.save(subscription);
            return true;
        }

        // Cancel the subscription in Stripe and get the period end date
        const cancelResult = await this.stripeService.cancelSubscription(
            subscription.stripeSubscriptionId,
        );

        console.log('cancelResult: ', cancelResult);

        // Set the subscription end date to the period end date from Stripe
        subscription.endDate = cancelResult.periodEndDate;
        await this.subscriptionsRepository.save(subscription);

        return true;
    }

    async getAgencyActiveSubscription(
        agencyId: number,
    ): Promise<ReadAgencySubscriptionDto> {
        const currentTimestamp = new Date().getTime();

        // Find subscription that is either:
        // 1. Has no end date (ongoing subscription), OR
        // 2. Has an end date that is in the future
        const subscription = await this.subscriptionsRepository.findOne({
            where: [
                {
                    agencyId: agencyId,
                    endDate: IsNull(),
                },
                {
                    agencyId: agencyId,
                    endDate: Not(IsNull()),
                    // We'll filter for future end dates in code instead of the query
                    // since TypeORM doesn't easily support "endDate > currentTimestamp" in where clause
                },
            ],
            relations: ['plan', 'pack', 'agency.agents'],
            // Order by endDate DESC to get null or furthest future date first
            order: {
                endDate: 'DESC',
            },
        });

        // No subscription found or the subscription's end date has passed
        if (
            !subscription ||
            (subscription.endDate !== null &&
                subscription.endDate < currentTimestamp)
        ) {
            throw new NotFoundException('ERR_SUBSCRIPTION_NOT_FOUND');
        }

        const sub = plainToClass(
            ReadAgencySubscriptionDto,
            {
                ...subscription,
                usedAgents: subscription.agency.agents.filter(
                    (agent) => !agent.isDeleted && agent.isActive,
                ).length,
            },
            {
                excludeExtraneousValues: true,
            },
        );

        return sub;
    }

    async canAddAgent(agencyId: number): Promise<boolean> {
        const subscription = await this.getAgencyActiveSubscription(agencyId);
        const userPacks = await this.getUserPacksForAgency(agencyId);

        // Calculate total allowed users from user packs
        let totalAllowedUsers = subscription.plan.maxAPI;
        for (const userPack of userPacks) {
            if (userPack.userCount === -1) {
                return true; // Unlimited users allowed
            }
            totalAllowedUsers += userPack.userCount;
        }

        return subscription.usedAgents < totalAllowedUsers;
    }

    /**
     * Returns the active subscription of an agency, with the payments made.
     * @param agencyId
     */
    async getActiveSubscriptionPayments(
        agencyId: number,
    ): Promise<Subscription> {
        return await this.subscriptionsRepository.findOne({
            where: {
                agencyId: agencyId,
                endDate: IsNull(),
            },
            relations: ['payments', 'plan'],
        });
    }

    async getAllActive(): Promise<Subscription[]> {
        return await this.subscriptionsRepository.find({
            where: {
                endDate: IsNull(),
            },
            relations: ['agency', 'plan', 'pack', 'payments'],
        });
    }

    /**
     * @Cron that runs every day at 02:00 and searchs every subscription that is on due to pay
     * for mor than 14 days and ends it.
     * @deprecated
     */
    // async checkExpiredSubscriptions(): Promise<void> {
    //     const allActive = await this.getAllActive();

    //     for (const subscription of allActive) {
    //         console.log('subscription pyments: ', subscription.payments);
    //         // get last subscription payment
    //         const lastPayment = subscription.payments.reduce(
    //             (latest, current) => {
    //                 return new Date(current.endPeriodDate) >
    //                     new Date(latest.endPeriodDate)
    //                     ? current
    //                     : latest;
    //             },
    //             subscription.payments[0],
    //         );

    //         console.log('Last payment: ', lastPayment);

    //         if (!lastPayment) {
    //             // end subscription
    //             console.log(
    //                 'Ending subscription for NOT PAYMENTS agency ',
    //                 subscription.agencyId,
    //             );
    //             subscription.endDate = new Date().getTime();
    //             await this.subscriptionsRepository.save(subscription);
    //             continue;
    //         }

    //         if (lastPayment.paidAt) {
    //             continue;
    //         }

    //         const currentDate = new Date().getTime();
    //         const diff = currentDate - Number(lastPayment.endPeriodDate);

    //         // if the difference is more than 14 days, end subscription
    //         if (diff > 14 * 24 * 60 * 60 * 1000) {
    //             console.log(
    //                 'Ending subscription for agency ',
    //                 subscription.agencyId,
    //             );
    //             subscription.endDate = new Date().getTime();
    //             await this.subscriptionsRepository.save(subscription);

    //             // delete the last payment
    //             await this.subscriptionPaymentsRepository.delete(
    //                 lastPayment.id,
    //             );
    //         }
    //     }
    // }

    private async validateSubscription(agency: Agency): Promise<boolean> {
        // Get all user packs associated with the agency's active subscription
        const userPacks = await this.getUserPacksForAgency(agency.id);

        // Calculate total allowed users based on user packs
        let totalAllowedUsers = 0;

        for (const userPack of userPacks) {
            // Handle unlimited users case
            if (userPack.userCount === -1) {
                return true; // Unlimited users allowed
            }

            totalAllowedUsers += userPack.userCount;
        }

        // Check if current agents count is within limit
        return agency.agents.length <= totalAllowedUsers;
    }

    private async getUserPacksForAgency(agencyId: number): Promise<UserPack[]> {
        // Get the agency's active subscription
        const subscription = await this.subscriptionsRepository.findOne({
            where: {
                agencyId: agencyId,
                endDate: IsNull(),
            },
            relations: ['plan'],
        });

        if (!subscription) {
            return [];
        }

        // If subscription has a pack, get it
        if (subscription.packId) {
            const userPack = await this.userPacksRepository.findOne({
                where: {
                    id: subscription.packId,
                    isActive: true,
                    isDeleted: false,
                },
            });

            return userPack ? [userPack] : [];
        }

        // If no pack is associated, return empty array
        return [];
    }

    /**
     * This subscription is for the register process, the agency here will be newly created and will have a free trial.
     * This agency will have no agents and wont be active till the email is confirmed.
     * @param agencyId
     * @param planId
     * @returns boolean
     */
    async subscribeForRegister(
        agencyId: number,
        planId: number,
    ): Promise<boolean> {
        // Validate Ids
        await this.validateIds(agencyId, planId);

        // create new subscription
        const newSubscription = {
            agencyId,
            planId,
            startDate: new Date().getTime(),
            endDate: null,
        };

        await this.subscriptionsRepository.save(newSubscription);

        return true;
    }

    /**
     * This subscription is for the register process with a user pack.
     * @param agencyId
     * @param planId
     * @param packId
     * @returns boolean
     */
    async subscribeWithPackForRegister(
        agencyId: number,
        planId: number,
        packId: number,
    ): Promise<boolean> {
        // Validate Ids
        await this.validateIds(agencyId, planId);

        // Validate User Pack
        const userPack = await this.userPacksRepository.findOne({
            where: {
                id: packId,
                isActive: true,
                isDeleted: false,
            },
        });

        if (!userPack) {
            throw new NotFoundException('ERR_USER_PACK_NOT_FOUND');
        }

        // create new subscription with pack
        const newSubscription = {
            agencyId,
            planId,
            packId,
            startDate: new Date().getTime(),
            endDate: null,
        };

        await this.subscriptionsRepository.save(newSubscription);

        return true;
    }

    /**
     * Retrieves all agencies that have expired subscriptions (endDate has passed)
     * @returns Array of agencies with expired subscriptions
     */
    async getAgenciesWithExpiredSubscriptions(): Promise<Agency[]> {
        const currentTimestamp = new Date().getTime();

        // Get all subscriptions where endDate exists and is in the past
        const expiredSubscriptions = await this.subscriptionsRepository.find({
            where: [
                {
                    endDate: Not(IsNull()),
                    // endDate less than current time
                },
            ],
            relations: ['agency'],
        });

        // Filter subscriptions to only those that have ended
        const expiredAgencies = expiredSubscriptions
            .filter((subscription) => subscription.endDate < currentTimestamp)
            .map((subscription) => subscription.agency)
            // Remove duplicates by agency ID
            .filter(
                (agency, index, self) =>
                    index === self.findIndex((a) => a.id === agency.id),
            );

        return expiredAgencies;
    }

    /**
     * Checks if the given agency has an active subscription
     * @param agencyId The ID of the agency to check
     * @returns Boolean indicating if the agency has an active subscription
     */
    async hasActiveSubscription(agencyId: number): Promise<boolean> {
        try {
            const currentTimestamp = new Date().getTime();

            // Get all subscriptions for this agency
            const subscriptions = await this.subscriptionsRepository.find({
                where: [
                    // Case 1: No end date (ongoing subscription)
                    {
                        agencyId: agencyId,
                        endDate: IsNull(),
                    },
                    // Case 2: End date exists but is in the future
                    {
                        agencyId: agencyId,
                        endDate: Not(IsNull()),
                    },
                ],
            });

            // Check if there's at least one active subscription
            // Either it has no end date, or the end date is in the future
            return subscriptions.some(
                (subscription) =>
                    subscription.endDate === null ||
                    subscription.endDate > currentTimestamp,
            );
        } catch (error) {
            console.error(
                `Error checking active subscription for agency ${agencyId}:`,
                error,
            );
            return false;
        }
    }
}
