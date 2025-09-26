import { Injectable, NotFoundException } from '@nestjs/common';
import { Plan } from './entities/plan.entity';
import { UserPack } from './entities/user-pack.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanFeature } from './entities/plan-feature.entity';

// services 
import { StripeService } from '../payments/modules/stripe/stripe.service';

// dto
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateUserPackDto } from './dto/create-user-pack.dto';
import { UpdateUserPackDto } from './dto/update-user-pack.dto';

@Injectable()
export class PlansService {
    constructor(
        @InjectRepository(Plan)
        private readonly plansRepository: Repository<Plan>,
        
        @InjectRepository(UserPack)
        private readonly userPacksRepository: Repository<UserPack>,
        
        @InjectRepository(PlanFeature)
        private readonly planFeaturesRepository: Repository<PlanFeature>,
        
        private readonly stripeService: StripeService
    ) {}

    // Plan methods
    async createPlan(createPlanDto: CreatePlanDto): Promise<Plan> {
        const { features, ...planData } = createPlanDto;
        
        // If this plan is set as default, unset any existing default plans
        if (planData.isDefaultPlan) {
            await this.unsetDefaultPlans();
        }
        
        const plan = await this.plansRepository.save(planData);
    
        // Upload plan to stripe
        const { productId, monthlyPriceId, annualPriceId } = await this.stripeService.createPlanProduct(plan);

        const updatedPlan = await this.plansRepository.save({
            ...plan,
            monthlyStripePriceId: monthlyPriceId,
            annualStripePriceId: annualPriceId,
            stripeProductId: productId,
        });

        if (features && features.length > 0) {
            const planFeatures = features.map(feature => ({
                ...feature,
                plan: updatedPlan
            }));
            await this.planFeaturesRepository.save(planFeatures);
        }

        return this.getPlanById(updatedPlan.id);
    }

    async getAllPlans(): Promise<Plan[]> {
        return await this.plansRepository.find({
            where: {
                isActive: true,
                isDeleted: false,
            },
            relations: ['features'],
            order: {
                features: {
                    order: 'ASC'
                }
            }
        });
    }

    async getDefaultPlanWithUserPacks(): Promise<{ plan: Plan; userPacks: UserPack[] }> {
        const defaultPlan = await this.plansRepository.findOne({
            where: {
                isDefaultPlan: true,
                isActive: true,
                isDeleted: false
            },
            relations: ['features'],
            order: {
                features: {
                    order: 'ASC'
                }
            }
        });

        if (!defaultPlan) {
            throw new NotFoundException('ERR_DEFAULT_PLAN_NOT_FOUND');
        }

        const userPacks = await this.getAllUserPacks();

        return {
            plan: defaultPlan,
            userPacks
        };
    }

    async getPlanById(id: number, select?: any): Promise<Plan> {
        return await this.plansRepository.findOne({
            where: { id, isActive: true, isDeleted: false },
            relations: ['features'],
            select,
            order: {
                features: {
                    order: 'ASC'
                }
            }
        });
    }

    async updatePlan(id: number, updatePlanDto: UpdatePlanDto): Promise<Plan> {
        const plan = await this.plansRepository.findOne({
            where: { id },
            relations: ['features']
        });

        if (!plan) {
            throw new NotFoundException('ERR_PLAN_NOT_FOUND');
        }

        const { features, ...planData } = updatePlanDto;

        // If we're setting this plan as default, unset any existing default plans
        if (planData.isDefaultPlan) {
            await this.unsetDefaultPlans();
        }

        const updatedPlan = {
            ...plan,
            ...planData,
        };

        const uPlan = await this.plansRepository.save(updatedPlan);

        if (features) {
            // Delete existing features
            await this.planFeaturesRepository.delete({ plan: { id } });
            
            // Create new features
            if (features.length > 0) {
                const planFeatures = features.map(feature => ({
                    ...feature,
                    plan: uPlan
                }));
                await this.planFeaturesRepository.save(planFeatures);
            }
        }

        const { monthlyPriceId, annualPriceId, productId } = await this.stripeService.updatePlanProduct(uPlan);
        
        await this.plansRepository.save({
            ...uPlan,
            monthlyStripePriceId: monthlyPriceId,
            annualStripePriceId: annualPriceId,
            stripeProductId: productId
        });

        return await this.getPlanById(uPlan.id);
    }

    // Helper method to ensure only one plan is set as default
    private async unsetDefaultPlans(): Promise<void> {
        await this.plansRepository.update(
            { isDefaultPlan: true },
            { isDefaultPlan: false }
        );
    }

    async deletePlan(id: number): Promise<void> {
        const plan = await this.plansRepository.findOne({
            where: { id },
        });

        if (!plan) {
            throw new NotFoundException('ERR_PLAN_NOT_FOUND');
        }

        // Features will be automatically deleted due to CASCADE
        await this.plansRepository.save({
            ...plan,
            isDeleted: true,
        });
    }

    // User Pack methods
    async createUserPack(createUserPackDto: CreateUserPackDto): Promise<UserPack> {
        const userPack = await this.userPacksRepository.save(createUserPackDto);
    
        // Upload user pack to stripe with both monthly and annual prices
        const { productId, monthlyPriceId, annualPriceId } = await this.stripeService.createUserPackProduct(userPack);

        return await this.userPacksRepository.save({
            ...userPack,
            monthlyStripePriceId: monthlyPriceId,
            annualStripePriceId: annualPriceId,
            stripeProductId: productId,
        });
    }

    async getAllUserPacks(): Promise<UserPack[]> {
        return await this.userPacksRepository.find({
            where: {
                isActive: true,
                isDeleted: false,
            },
            order: {
                userCount: 'ASC'
            }
        });
    }

    async getUserPackById(id: number): Promise<UserPack> {
        return await this.userPacksRepository.findOne({
            where: { id, isActive: true, isDeleted: false }
        });
    }

    async updateUserPack(id: number, updateUserPackDto: UpdateUserPackDto): Promise<UserPack> {
        const userPack = await this.userPacksRepository.findOne({
            where: { id }
        });

        if (!userPack) {
            throw new NotFoundException('ERR_USER_PACK_NOT_FOUND');
        }

        const updatedUserPack = {
            ...userPack,
            ...updateUserPackDto,
        };

        const uUserPack = await this.userPacksRepository.save(updatedUserPack);

        const { monthlyPriceId, annualPriceId, productId } = await this.stripeService.updateUserPackProduct(uUserPack);
        
        return await this.userPacksRepository.save({
            ...uUserPack,
            monthlyStripePriceId: monthlyPriceId,
            annualStripePriceId: annualPriceId,
            stripeProductId: productId
        });
    }

    async deleteUserPack(id: number): Promise<void> {
        const userPack = await this.userPacksRepository.findOne({
            where: { id },
        });

        if (!userPack) {
            throw new NotFoundException('ERR_USER_PACK_NOT_FOUND');
        }

        await this.userPacksRepository.save({
            ...userPack,
            isDeleted: true,
        });
    }
}
