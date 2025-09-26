import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';

// Entities
import { Prescriptor } from './entities/prescriptor.entity';

// DTOs
import { RegisterPrescriptorDto } from './dto/register-prescriptor.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ReferredAgencyDto } from './dto/referred-agency.dto';
import { DashboardDto } from './dto/dashboard.dto';

// Services
import { MailsService } from '../mails/mails.service';

@Injectable()
export class PrescriptorsService {
    constructor(
        @InjectRepository(Prescriptor)
        private readonly prescriptorsRepository: Repository<Prescriptor>,
        private readonly mailsService: MailsService,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * Generate a unique reference code for the prescriptor
     */
    private async generateReferenceCode(): Promise<string> {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let referenceCode = '';
        let isUnique = false;

        while (!isUnique) {
            // Generate a 6-character code
            referenceCode = '';
            for (let i = 0; i < 6; i++) {
                referenceCode += characters.charAt(
                    Math.floor(Math.random() * characters.length),
                );
            }

            // Check if the code is unique
            const existingPrescriptor = await this.prescriptorsRepository.findOne({
                where: { referenceCode },
            });

            if (!existingPrescriptor) {
                isUnique = true;
            }
        }

        return referenceCode;
    }

    /**
     * Generate a 6-digit verification code
     */
    private generateVerificationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Register a new prescriptor
     */
    async register(registerPrescriptorDto: RegisterPrescriptorDto): Promise<Prescriptor> {
        const { email, password, ...rest } = registerPrescriptorDto;

        // Check if email already exists
        const existingPrescriptor = await this.prescriptorsRepository.findOne({
            where: { email, isDeleted: false },
        });

        if (existingPrescriptor) {
            throw new BadRequestException('ERR_EMAIL_ALREADY_EXISTS');
        }

        // Generate reference code
        const referenceCode = await this.generateReferenceCode();

        // Generate verification code
        const verificationCode = this.generateVerificationCode();
        const verificationCodeExpires = Date.now() + 3600000; // 1 hour

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create prescriptor
        const prescriptor = this.prescriptorsRepository.create({
            email,
            password: hashedPassword,
            referenceCode,
            verificationCode,
            verificationCodeExpires,
            ...rest,
        });

        // Save prescriptor
        const savedPrescriptor = await this.prescriptorsRepository.save(prescriptor);

        // Send verification email
        await this.mailsService.sendVerificationCodeMail({
            to: email,
            code: parseInt(verificationCode),
        });

        return savedPrescriptor;
    }

    /**
     * Verify prescriptor email
     */
    async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ token: string }> {
        const { email, code } = verifyEmailDto;

        // Find prescriptor
        const prescriptor = await this.prescriptorsRepository.findOne({
            where: { email, isDeleted: false },
        });

        if (!prescriptor) {
            throw new NotFoundException('ERR_PRESCRIPTOR_NOT_FOUND');
        }

        // Check if already verified
        if (prescriptor.isVerified) {
            throw new BadRequestException('ERR_EMAIL_ALREADY_VERIFIED');
        }

        // Check verification code
        if (
            prescriptor.verificationCode !== code.toString() ||
            Date.now() > prescriptor.verificationCodeExpires
        ) {
            throw new BadRequestException('ERR_INVALID_VERIFICATION_CODE');
        }

        // Update prescriptor
        prescriptor.isVerified = true;
        prescriptor.verificationCode = null;
        prescriptor.verificationCodeExpires = null;

        await this.prescriptorsRepository.save(prescriptor);

        // Generate JWT token
        const token = this.jwtService.sign({
            id: prescriptor.id,
            email: prescriptor.email,
            role: 'prescriptor',
        });

        return { token };
    }

    /**
     * Get prescriptor by email
     */
    async getByEmail(email: string, select?: (keyof Prescriptor)[]): Promise<Prescriptor> {
        return await this.prescriptorsRepository.findOne({
            where: { email, isDeleted: false },
            select: select ? Object.fromEntries(select.map(key => [key, true])) : undefined,
        });
    }

    /**
     * Get prescriptor by ID
     */
    async getById(id: number, select?: (keyof Prescriptor)[]): Promise<Prescriptor> {
        return await this.prescriptorsRepository.findOne({
            where: { id, isDeleted: false },
            select: select ? Object.fromEntries(select.map(key => [key, true])) : undefined,
        });
    }

    /**
     * Get referred agencies for a prescriptor
     */
    async getReferredAgencies(prescriptorId: number): Promise<ReferredAgencyDto[]> {
        const prescriptor = await this.prescriptorsRepository.findOne({
            where: { id: prescriptorId, isDeleted: false },
            relations: ['referredAgencies'],
        });

        if (!prescriptor) {
            throw new NotFoundException('ERR_PRESCRIPTOR_NOT_FOUND');
        }

        // Filter out deleted agencies and transform to DTO
        const agencies = prescriptor.referredAgencies
            .filter(agency => !agency.isDeleted)
            .map(agency => plainToClass(ReferredAgencyDto, agency, { 
                excludeExtraneousValues: true 
            }));
            
        return agencies;
    }

    /**
     * Get dashboard data for a prescriptor
     */
    async getDashboard(prescriptorId: number): Promise<DashboardDto> {
        const prescriptor = await this.prescriptorsRepository.findOne({
            where: { id: prescriptorId, isDeleted: false },
            relations: ['referredAgencies'],
        });

        if (!prescriptor) {
            throw new NotFoundException('ERR_PRESCRIPTOR_NOT_FOUND');
        }

        // Get active agencies
        const agencies = prescriptor.referredAgencies.filter(agency => !agency.isDeleted);
        const activeAgencies = agencies.filter(agency => agency.isActive);

        // Calculate total earnings (implement according to your business logic)
        const totalEarnings = 0; // Placeholder - implement actual calculation

        // Generate monthly referrals data for the last 6 months
        const montlyReferrals = this.getMonthlyReferrals(agencies);

        return {
            totalReferredAgencies: agencies.length,
            activeReferredAgencies: activeAgencies.length,
            totalEarnings,
            montlyReferrals
        };
    }

    /**
     * Calculate monthly referrals for the last 6 months
     */
    private getMonthlyReferrals(agencies: any[]): { month: string, referrals: number }[] {
        const months = [];
        const now = new Date();
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        
        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = monthNames[month.getMonth()];
            
            // Count agencies created in this month
            const referralsCount = agencies.filter(agency => {
                const agencyDate = new Date(agency.createdAt);
                return agencyDate.getMonth() === month.getMonth() && 
                       agencyDate.getFullYear() === month.getFullYear();
            }).length;
            
            months.push({ month: monthName, referrals: referralsCount });
        }
        
        return months;
    }
} 