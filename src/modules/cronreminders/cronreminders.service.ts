import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

// services
import { ReminderTypes } from '../reminders/enum/reminder-types.enum';
import { RemindersService } from '../reminders/reminders.service';
import { PaymentsService } from '../payments/payments.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { JobsService } from '../jobs/jobs.service';
import { AgenciesService } from '../agencies/agencies.service';
import { MailsService } from '../mails/mails.service';

@Injectable()
export class CronremindersService {
    constructor(
        private readonly appointmentsService: AppointmentsService,
        private readonly remindersService: RemindersService,
        private readonly paymentsService: PaymentsService,
        private readonly subscriptionsService: SubscriptionsService,
        private readonly jobsService: JobsService,
        private readonly agenciesService: AgenciesService,
        private readonly mailsService: MailsService,
    ) {}

    // cron that runs every 1 minute
    @Cron('*/1 * * * *')
    async reminders() {
        // find all expired reminders
        const expiredReminders =
            await this.remindersService.findExpiredReminders();

        // console.log('Expired reminders: ', expiredReminders);

        // go through each expired reminder and execute the action
        for (const reminder of expiredReminders) {
            switch (reminder.case) {
                case ReminderTypes.DISTPATCH_EMAIL:
                    await this.remindersService.dispatchEmail(
                        reminder.id,
                        reminder.config,
                    );
                    break;
                default:
                    console.log('No case found for reminder id ', reminder.id);
            }
        }
    }

    // Cron that creates the payments for the subscriptions
    // Runs every day at 02:00 and searchs every subscription that is on due to pay
    // @deprecated
    // @Cron('0 2 * * *')
    // async createPayments() {
    //     try {
    //         await this.paymentsService.createSubscriptionPayments();

    //         setTimeout(() => {
    //             this.subscriptionsService.checkExpiredSubscriptions();
    //         }, 3000);
    //     } catch (error) {
    //         console.log('Error creating payments: ', error);
    //     }
    // }

    /**
     * Runs every day at 6:00 AM to deactivate agencies with expired subscriptions
     * and send notification emails to those agencies
     */
    @Cron('0 6 * * *')
    async deactivateExpiredSubscriptions() {
        try {
            console.log('Running deactivate expired subscriptions cron job');

            // Get all agencies with expired subscriptions
            const expiredAgencies =
                await this.subscriptionsService.getAgenciesWithExpiredSubscriptions();

            console.log(
                `Found ${expiredAgencies.length} agencies with expired subscriptions`,
            );

            // Process each expired agency
            for (const agency of expiredAgencies) {
                if (agency.isActive) {
                    // Deactivate the agency
                    await this.agenciesService.update(agency.id, {
                        isActive: false,
                    });

                    // Send notification email
                    await this.mailsService.sendSubscriptionExpiredEmail({
                        to: agency.email,
                        agencyName: agency.name,
                    });

                    console.log(
                        `Deactivated agency ${agency.id} (${agency.name}) due to expired subscription`,
                    );
                }
            }
        } catch (error) {
            console.error('Error deactivating expired subscriptions:', error);
        }
    }

    @Cron('*/1 * * * *')
    async checkAppointmentsDate() {
        try {
            await this.appointmentsService.checkAppointmentsDate();
        } catch (error) {
            console.log('Error checking appointments date: ', error);
        }
    }

    @Cron('*/1 * * * *')
    async checkExpiredJobs() {
        //TODO: quede aca, tengo que hacer esto
        // try {
        //     await this.jobsService.checkExpiredJobs();
        // } catch (error) {
        //     console.log('Error checking expired jobs: ', error);
        // }
    }
}
