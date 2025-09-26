import { Injectable } from '@nestjs/common';

import { MailerService } from '@nestjs-modules/mailer';
import { envs } from 'src/config/envs.config';
import { defaultEmails } from '../email-templates/html-templates/default-emails';

// enum
import { EmailTemplatesCases } from '../email-templates/enum/email-templates-cases.enum';
import { PaymentConfirmationMail } from './interfaces/payment-confirmation-mail.interface';
import { PendingPaymentMail } from './interfaces/pendig-payment-mail.interface';
import { VerificationCodeMail } from './interfaces/verification-code-mail.interface';
import { ContactForm } from './interfaces/contact-form.interface';
import { WelcomeEmail } from './interfaces/welcome-email.interface';

@Injectable()
export class MailsService {
    constructor(private readonly mailerService: MailerService) {}

    private async sendMail({
        to,
        subject,
        text,
        html,
        from,
        replyTo,
    }: {
        to: string;
        subject: string;
        text: string;
        html?: string;
        from?: string;
        replyTo?: string;
    }) {
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                text,
                html,
                from: from ?? 'no-reply@matchfloor.com',
                replyTo: replyTo ?? 'contact@matchfloor.com',
            });
        } catch (error) {
            console.log(error);

            throw new Error(`Error sending email: ${error.message}`);
        }
    }

    async sendForgotPasswordEmail({
        to,
        token,
        obj,
    }: {
        to: string;
        token: string;
        obj: 'agent' | 'agency';
    }) {
        const url = `${envs.FRONTEND_URL}/${obj}/reset-password?token=${token}`;

        return this.sendMail({
            to,
            subject: 'Forgot Password',
            text: `Forgot Password? Click here to reset your password: ${url}`,
        });
    }

    //TODO: add from and replyTo
    async sendRecivedAppointment({
        clientName,
        clientMail,
        residenceName,
        day,
        hour,
        agencyName,
        agencyMail,
        agentMail,
    }: {
        clientName: string;
        clientMail: string;
        residenceName: string;
        day: string;
        hour: string;
        agencyName: string;
        agencyMail: string;
        agentMail: string;
    }) {
        const emailTemplate = defaultEmails.find(
            (email) => email.case === EmailTemplatesCases.APPOINTMENT_RECIVED,
        );

        if (!emailTemplate) {
            return new Error('Email template not found');
        }

        const html = emailTemplate.html
            .replaceAll('{{ CLIENT_NAME }}', clientName)
            .replaceAll('{{ RESIDENCE_NAME }}', residenceName)
            .replaceAll('{{ DAY }}', day)
            .replaceAll('{{ HOUR }}', hour)
            .replaceAll('{{ AGENCY_NAME }}', agencyName)
            .replaceAll('{{ AGENCY_MAIL }}', agencyMail);

        await this.sendMail({
            to: clientMail,
            subject: `Cita Solicitada ${clientName} para ${residenceName} el ${day} a las ${hour} hs`,
            text: 'Cita Solicitada',
            html,
            replyTo: agentMail ?? agencyMail,
        });
    }

    //TODO: add from and replyTo
    async sendMailNewAppoiment({
        agentMail,
        agentName,
        clientName,
        clientMail,
        phone = '',
        day,
        hour,
        notes,
        residenceName,
        agencyName,
        agencyMail,
        agentConfirmToken,
        agentCancelToken,
        rescheduleToken,
    }: {
        agentMail: string;
        agentName: string;
        clientName: string;
        clientMail: string;
        phone?: string;
        day: string;
        hour: string;
        notes: string;
        residenceName: string;
        agencyName: string;
        agencyMail: string;
        agentConfirmToken: string;
        agentCancelToken: string;
        rescheduleToken: string;
    }) {
        const emailTemplate = defaultEmails.find(
            (email) =>
                email.case === EmailTemplatesCases.SCHEDULE_APPOINTMENT_API,
        );

        if (!emailTemplate) {
            return new Error('Email template not found');
        }

        const html = emailTemplate.html
            .replaceAll('{{ AGENT_NAME }}', agentName)
            .replaceAll('{{ CLIENT_NAME }}', clientName)
            .replaceAll('{{ CLIENT_MAIL }}', clientMail)
            .replaceAll('{{ PHONE }}', phone ?? '')
            .replaceAll('{{ DAY }}', day)
            .replaceAll('{{ HOUR }}', hour)
            .replaceAll('{{ NOTES }}', notes)
            .replaceAll('{{ HOME_NAME }}', residenceName)
            .replaceAll('{{ AGENCY_NAME }}', agencyName)
            .replaceAll('{{ AGENCY_MAIL }}', agencyMail)
            .replaceAll('{{ CONFIRM_TOKEN }}', agentConfirmToken)
            .replaceAll('{{ CANCEL_TOKEN }}', agentCancelToken)
            .replaceAll('{{ RESCHEDULE_TOKEN }}', rescheduleToken);

        return this.sendMail({
            to: agentMail,
            subject: `Solicitud de nueva cita ${clientName}, ${day}, ${hour} hs`,
            text: `Nueva cita para ${agentName}`,
            html,
            replyTo: agencyMail,
        });
    }

    //TODO: add from and replyTo
    async sendRejectedMailClient({
        clientMail,
        clientName,
        day,
        hour,
        residenceName,
        agencyName,
        agencyMail,
        agentMail,
    }: {
        clientMail: string;
        clientName: string;
        day: string;
        hour: string;
        residenceName: string;
        agencyName: string;
        agencyMail: string;
        agentMail: string;
    }) {
        const emailTemplate = defaultEmails.find(
            (email) =>
                email.case ===
                EmailTemplatesCases.APPOINTMENT_REJECTED_API_TO_CLIENT,
        );

        if (!emailTemplate) {
            return new Error('Email template not found');
        }

        const html = emailTemplate.html
            .replaceAll('{{ CLIENT_NAME }}', clientName)
            .replaceAll('{{ DAY }}', day)
            .replaceAll('{{ HOUR }}', hour)
            .replaceAll('{{ RESIDENCE_NAME }}', residenceName)
            .replaceAll('{{ AGENCY_NAME }}', agencyName)
            .replaceAll('{{ AGENCY_MAIL }}', agencyMail);

        return this.sendMail({
            to: clientMail,
            subject: `Cita rechazada ${clientName} para ${residenceName} el ${day} a las ${hour} hs`,
            text: 'Cita rechazada',
            html,
            replyTo: agentMail ?? agencyMail,
        });
    }

    //TODO: add from and replyTo
    async sendRescheduleMailClient({
        clientMail,
        clientName,
        day,
        hour,
        residenceName,
        agencyName,
        agencyMail,
        clientConfirmToken,
        clientCancelToken,
        agentMail,
    }: {
        clientMail: string;
        clientName: string;
        day: string;
        hour: string;
        residenceName: string;
        agencyName: string;
        agencyMail: string;
        clientConfirmToken: string;
        clientCancelToken: string;
        agentMail: string;
    }) {
        const emailTemplate = defaultEmails.find(
            (email) =>
                email.case === EmailTemplatesCases.RESCHEDULE_APPOINTMENT,
        );

        if (!emailTemplate) {
            return new Error('Email template not found');
        }

        const html = emailTemplate.html
            .replaceAll('{{ CLIENT_NAME }}', clientName)
            .replaceAll('{{ DAY }}', day)
            .replaceAll('{{ HOUR }}', hour)
            .replaceAll('{{ RESIDENCE_NAME }}', residenceName)
            .replaceAll('{{ AGENCY_NAME }}', agencyName)
            .replaceAll('{{ AGENCY_MAIL }}', agencyMail)
            .replaceAll('{{ CONFIRM_TOKEN }}', clientConfirmToken)
            .replaceAll('{{ CANCEL_TOKEN }}', clientCancelToken);

        return this.sendMail({
            to: clientMail,
            subject: `Cita reprogramada ${clientName} para ${residenceName} el ${day} a las ${hour} hs`,
            text: 'Cita reprogramada',
            html,
            replyTo: agentMail ?? agencyMail,
        });
    }

    //TODO: add from and replyTo
    async sendMailOwnerConfirmation({
        ownerMail,
        agencyName,
        agencyMail,
        agentMail,
        day,
        hour,
        residenceName,
        ownerConfirmToken,
        ownerCancelToken,
    }: {
        ownerMail: string;
        agencyName: string;
        agencyMail: string;
        agentMail: string;
        day: string;
        hour: string;
        residenceName: string;
        ownerConfirmToken: string;
        ownerCancelToken: string;
    }) {
        const emailTemplate = defaultEmails.find(
            (email) =>
                email.case ===
                EmailTemplatesCases.CONFIRM_APPOINTMENT_API_TO_OWNER,
        );

        if (!emailTemplate) {
            return new Error('Email template not found');
        }

        const html = emailTemplate.html
            .replaceAll('{{ DAY }}', day)
            .replaceAll('{{ HOUR }}', hour)
            .replaceAll('{{ RESIDENCE_NAME }}', residenceName)
            .replaceAll('{{ AGENCY_NAME }}', agencyName)
            .replaceAll('{{ AGENCY_MAIL }}', agencyMail)
            .replaceAll('{{ CONFIRM_TOKEN }}', ownerConfirmToken)
            .replaceAll('{{ CANCEL_TOKEN }}', ownerCancelToken);

        return this.sendMail({
            to: ownerMail,
            subject: `Nueva cita propietario de ${residenceName} a las ${hour} hs el ${day}`,
            text: 'Nueva cita propietario',
            html,
            replyTo: agentMail ?? agencyMail,
        });
    }

    //TODO: add from and replyTo
    async sendCancelOwnerAppointment({
        clientMail,
        clientName,
        agentMail,
        agentName,
        residenceName,
        day,
        hour,
        agencyName,
        agencyMail,
    }: {
        clientMail: string;
        clientName: string;
        agentMail: string;
        agentName: string;
        agencyMail: string;
        residenceName: string;
        day: string;
        hour: string;
        agencyName: string;
    }) {
        const emailTemplate = defaultEmails.find(
            (email) =>
                email.case === EmailTemplatesCases.CANCEL_OWNER_APPOINTMENT,
        );

        if (!emailTemplate) {
            return new Error('Email template not found');
        }

        const htmlForClient = emailTemplate.html
            .replaceAll('{{ FULL_NAME }}', clientName)
            .replaceAll('{{ RESIDENCE_NAME }}', residenceName)
            .replaceAll('{{ DAY }}', day)
            .replaceAll('{{ HOUR }}', hour)
            .replaceAll('{{ AGENCY_NAME }}', agencyName)
            .replaceAll('{{ AGENCY_MAIL }}', agencyMail);

        await this.sendMail({
            to: clientMail,
            subject: `Cancelación de la cita por parte propietario ${clientName} para ${residenceName} el ${day} a las ${hour} hs`,
            text: 'Cancelación del propietario',
            html: htmlForClient,
            replyTo: agencyMail,
        });

        const htmlForAgent = emailTemplate.html
            .replaceAll('{{ FULL_NAME }}', agentName)
            .replaceAll('{{ RESIDENCE_NAME }}', residenceName)
            .replaceAll('{{ DAY }}', day)
            .replaceAll('{{ HOUR }}', hour)
            .replaceAll('{{ AGENCY_NAME }}', agencyName)
            .replaceAll('{{ AGENCY_MAIL }}', agencyMail);

        await this.sendMail({
            to: agentMail,
            subject: `Cancelación de la cita por parte propietario ${clientName} para ${residenceName} el ${day} a las ${hour} hs`,
            text: 'Cancelación del propietario',
            html: htmlForAgent,
            replyTo: agencyMail,
        });
    }

    //TODO: add from and replyTo
    async sendAppointmentAccepted({
        clientName,
        clientMail,
        agentName,
        agentMail,
        residenceName,
        day,
        hour,
        agencyName,
        agencyMail,
    }: {
        clientName: string;
        clientMail: string;
        agentMail: string;
        agentName: string;
        day: string;
        hour: string;
        residenceName: string;
        agencyName: string;
        agencyMail: string;
    }) {
        const emailTemplate = defaultEmails.find(
            (email) => email.case === EmailTemplatesCases.APPOINTMENT_ACCEPTED,
        );

        if (!emailTemplate) {
            return new Error('Email template not found');
        }

        const htmlForClient = emailTemplate.html
            .replaceAll('{{ FULL_NAME }}', clientName)
            .replaceAll('{{ DAY }}', day)
            .replaceAll('{{ HOUR }}', hour)
            .replaceAll('{{ RESIDENCE_NAME }}', residenceName)
            .replaceAll('{{ AGENCY_NAME }}', agencyName)
            .replaceAll('{{ AGENCY_MAIL }}', agencyMail);

        await this.sendMail({
            to: clientMail,
            subject: `Cita Aceptada ${clientName} para ${residenceName} el ${day} a las ${hour} hs`,
            text: 'Cita Aceptada',
            html: htmlForClient,
            replyTo: agencyMail,
        });

        const htmlForAgent = emailTemplate.html
            .replaceAll('{{ FULL_NAME }}', agentName)
            .replaceAll('{{ DAY }}', day)
            .replaceAll('{{ HOUR }}', hour)
            .replaceAll('{{ RESIDENCE_NAME }}', residenceName)
            .replaceAll('{{ AGENCY_NAME }}', agencyName)
            .replaceAll('{{ AGENCY_MAIL }}', agencyMail);

        await this.sendMail({
            to: agentMail,
            subject: `Cita Aceptada ${agentName} para ${residenceName} el ${day} a las ${hour} hs`,
            text: 'Cita Aceptada',
            html: htmlForAgent,
            replyTo: agencyMail,
        });
    }

    //TODO: add from and replyTo
    async sendReminderAppointment({
        clientName,
        clientMail,
        agentMail,
        day,
        hour,
        residenceName,
        agencyName,
        agencyMail,
        clientConfirmToken,
        clientCancelToken,
    }: {
        clientName: string;
        clientMail: string;
        agentMail: string;
        residenceName: string;
        day: string;
        hour: string;
        agencyName: string;
        agencyMail: string;
        clientConfirmToken: string;
        clientCancelToken: string;
    }) {
        const emailTemplate = defaultEmails.find(
            (email) => email.case === EmailTemplatesCases.APPOINTMENT_REMINDER,
        );

        if (!emailTemplate) {
            return new Error('Email template not found');
        }

        const html = emailTemplate.html
            .replaceAll('{{ CLIENT_NAME }}', clientName)
            .replaceAll('{{ RESIDENCE_NAME }}', residenceName)
            .replaceAll('{{ DAY }}', day)
            .replaceAll('{{ HOUR }}', hour)
            .replaceAll('{{ AGENCY_NAME }}', agencyName)
            .replaceAll('{{ AGENCY_MAIL }}', agencyMail)
            .replaceAll('{{ CONFIRM_TOKEN }}', clientConfirmToken)
            .replaceAll('{{ CANCEL_TOKEN }}', clientCancelToken);

        return this.sendMail({
            to: clientMail,
            subject: `Recordatorio de cita ${clientName} para ${residenceName} el ${day} a las ${hour} hs`,
            text: 'Recordatorio de cita',
            html,
            replyTo: agentMail ?? agencyMail,
        });
    }

    //TODO: add from and replyTo
    async sendReminderAgentOwner({
        agentName,
        ownerName,
        clientName,
        day,
        hour,
        residenceName,
        agencyName,
        agencyMail,
        ownerMail,
        agentMail,
    }: {
        agentName: string;
        ownerName: string;
        clientName: string;
        residenceName: string;
        day: string;
        hour: string;
        agencyName: string;
        agencyMail: string;
        ownerMail: string;
        agentMail: string;
    }) {
        const emailTemplate = defaultEmails.find(
            (email) =>
                email.case ===
                EmailTemplatesCases.APPOINTMENT_REMINDER_AGENT_OWNER,
        );

        if (!emailTemplate) {
            return new Error('Email template not found');
        }

        // To agent mail and name
        const htmlForAgent = emailTemplate.html
            .replaceAll('{{ NAME }}', agentName)
            .replaceAll('{{ CLIENT_NAME }}', clientName)
            .replaceAll('{{ RESIDENCE_NAME }}', residenceName)
            .replaceAll('{{ DAY }}', day)
            .replaceAll('{{ HOUR }}', hour)
            .replaceAll('{{ AGENCY_NAME }}', agencyName)
            .replaceAll('{{ AGENCY_MAIL }}', agencyMail);

        await this.sendMail({
            to: agentMail,
            subject: `Recordatorio de cita ${clientName} para ${residenceName} el ${day} a las ${hour} hs`,
            text: 'Recordatorio de cita',
            html: htmlForAgent,
            replyTo: agencyMail,
        });

        // To owner mail and name
        const htmlForOwner = emailTemplate.html
            .replaceAll('{{ NAME }}', ownerName)
            .replaceAll('{{ CLIENT_NAME }}', clientName)
            .replaceAll('{{ RESIDENCE_NAME }}', residenceName)
            .replaceAll('{{ DAY }}', day)
            .replaceAll('{{ HOUR }}', hour)
            .replaceAll('{{ AGENCY_NAME }}', agencyName)
            .replaceAll('{{ AGENCY_MAIL }}', agencyMail);

        await this.sendMail({
            to: ownerMail,
            subject: `Recordatorio de cita ${clientName} para ${residenceName} el ${day} a las ${hour} hs`,
            text: 'Recordatorio de cita',
            html: htmlForOwner,
            replyTo: agencyMail,
        });
    }

    //TODO: add from and replyTo
    async sendClientCancellationEmail({
        agentMail,
        agentName,
        clientName,
        ownerMail,
        day,
        hour,
        residenceName,
        agencyName,
        agencyMail,
    }: {
        agentMail: string;
        agentName: string;
        ownerMail: string;
        clientName: string;
        day: string;
        hour: string;
        residenceName: string;
        agencyName: string;
        agencyMail: string;
    }) {
        const emailTemplate = defaultEmails.find(
            (email) =>
                email.case === EmailTemplatesCases.APPOINTMENT_CLIENT_CANCELED,
        );

        if (!emailTemplate) {
            console.error(
                'Email template for APPOINTMENT_CLIENT_CANCELED not found',
            );
            throw new Error('Email template not found');
        }

        const createEmailContent = (recipientName: string) =>
            emailTemplate.html
                .replaceAll('{{ FULL_NAME }}', recipientName)
                .replaceAll('{{ DAY }}', day)
                .replaceAll('{{ HOUR }}', hour)
                .replaceAll('{{ RESIDENCE_NAME }}', residenceName)
                .replaceAll('{{ AGENCY_NAME }}', agencyName)
                .replaceAll('{{ AGENCY_MAIL }}', agencyMail);

        const agentEmailContent = createEmailContent(agentName);
        const ownerEmailContent = createEmailContent('Propietario/a');

        await Promise.all([
            this.sendMail({
                to: agentMail,
                subject: `Cancelación de la cita por el cliente: ${clientName} para ${residenceName} el ${day} a las ${hour} hs`,
                text: 'Cancelación cita cliente',
                html: agentEmailContent,
                replyTo: agencyMail,
            }),
            this.sendMail({
                to: ownerMail,
                subject: `Cancelación de la cita por el cliente: ${clientName} para ${residenceName} el ${day} a las ${hour} hs`,
                text: 'Cancelación cita cliente',
                html: ownerEmailContent,
                replyTo: agencyMail,
            }),
        ]);
    }

    //TODO: add from and replyTo
    async sendClientRescheduleCancellationEmail({
        agentMail,
        agentName,
        clientName,
        day,
        hour,
        residenceName,
        agencyName,
        agencyMail,
    }: {
        agentMail: string;
        agentName: string;
        clientName: string;
        day: string;
        hour: string;
        residenceName: string;
        agencyName: string;
        agencyMail: string;
    }) {
        const emailTemplate = defaultEmails.find(
            (email) =>
                email.case === EmailTemplatesCases.APPOINTMENT_CLIENT_CANCELED,
        );

        if (!emailTemplate) {
            return new Error('Email template not found');
        }

        const html = emailTemplate.html
            .replaceAll('{{ FULL_NAME }}', agentName)
            .replaceAll('{{ DAY }}', day)
            .replaceAll('{{ HOUR }}', hour)
            .replaceAll('{{ RESIDENCE_NAME }}', residenceName)
            .replaceAll('{{ AGENCY_NAME }}', agencyName)
            .replaceAll('{{ AGENCY_MAIL }}', agencyMail);

        await this.sendMail({
            to: agentMail,
            subject: `Cita cancelada por el cliente ${clientName} para ${residenceName} el ${day} a las ${hour} hs`,
            text: 'Cita cancelada por el cliente',
            html,
            replyTo: agencyMail,
        });
    }

    async sendPaymentConfirmationMail({
        to,
        receiptUrl,
    }: PaymentConfirmationMail) {
        return this.sendMail({
            to: to,
            subject: `Confirmacíon de pago por suscripción`,
            text: `Recibimos tu pago, gracias por confiar en nosotros. Para ver el recibo de tu pago, ingresa en este link: ${receiptUrl}`,
        });
    }

    async sendPendingPaymentMail({ to, paymentUrl }: PendingPaymentMail) {
        return this.sendMail({
            to: to,
            subject: `Pago pendiente por suscripción`,
            text: `Tienes un pago pendiente, por favor realiza el pago para continuar disfrutando de nuestros servicios. Para realizar el pago, ingresa en este link: ${paymentUrl}`,
        });
    }

    async sendVerificationCodeMail({ to, code }: VerificationCodeMail) {
        const subject = 'Verify your email address';
        const text = `Your verification code is: ${code}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Email Verification</h2>
                <p>Thank you for registering as a prescriptor. Please use the following code to verify your email address:</p>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                    ${code}
                </div>
                <p>This code will expire in 1 hour.</p>
                <p>If you did not request this verification, please ignore this email.</p>
            </div>
        `;

        return this.sendMail({
            to,
            subject,
            text,
            html,
        });
    }

    async sendSubscriptionPaymentConfirmation({
        to,
        paymentUrl,
    }: {
        to: string;
        paymentUrl: string;
    }) {
        return this.sendMail({
            to,
            subject: 'Confirmación de pago',
            text: `Tu pago fue acreditado con exito, gracias por confiar en nosotros. Para ver el recibo de tu pago, ingresa en este link: ${paymentUrl}`,
        });
    }

    async sendNewAgencyAdminEmail({
        to,
        agencyName,
        agencyMail,
    }: {
        to: string;
        agencyName: string;
        agencyMail: string;
    }) {
        return this.sendMail({
            to,
            subject: 'Se registro una nueva agencia',
            text: `Se registro una nueva agencia: ${agencyName} con el email: ${agencyMail}`,
        });
    }

    /**
     * Sends an email to notify an agency about their expired subscription
     * @param to Agency email address
     * @param agencyName Name of the agency
     */
    async sendSubscriptionExpiredEmail({
        to,
        agencyName,
    }: {
        to: string;
        agencyName: string;
    }) {
        return this.sendMail({
            to,
            subject: 'Tu suscripción ha expirado',
            text: `Estimado/a ${agencyName}, tu suscripción ha expirado. Tu agencia ha sido desactivada. Por favor renueva tu suscripción para continuar utilizando nuestros servicios.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Suscripción Expirada</h2>
                    <p>Estimado/a <strong>${agencyName}</strong>,</p>
                    <p>Lamentamos informarte que tu suscripción ha expirado y tu agencia ha sido desactivada.</p>
                    <p>Para continuar utilizando nuestros servicios, por favor renueva tu suscripción lo antes posible accediendo a tu cuenta.</p>
                    <p>Si necesitas ayuda o tienes alguna pregunta, no dudes en contactarnos.</p>
                    <p>Saludos cordiales,<br/>El equipo de soporte</p>
                </div>
            `,
        });
    }

    async sendContactFormEmail({ name, email, company, message }: ContactForm) {
        const adminEmail = envs.DEFAULT_ADMIN_EMAIL || 'admin@yourdomain.com';
        const subject = `Nuevo mensaje del formulario de contacto de ${name}`;

        console.log('Enviando correo de formulario de contacto a', adminEmail);

        // Create HTML content with proper formatting for admin
        const adminHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Nuevo mensaje del formulario de contacto</h2>
                <p><strong>Nombre:</strong> ${name}</p>
                <p><strong>Correo electrónico:</strong> ${email}</p>
                ${company ? `<p><strong>Empresa:</strong> ${company}</p>` : ''}
                <h3>Mensaje:</h3>
                <div style="background-color: #f4f4f4; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                <p style="color: #666; font-size: 0.9em;">Este correo fue enviado desde el formulario de contacto de su sitio web.</p>
            </div>
        `;

        // Plain text version as fallback for admin
        const adminText = `
            Nuevo mensaje del formulario de contacto
            ---------------------------------------
            Nombre: ${name}
            Correo electrónico: ${email}
            ${company ? `Empresa: ${company}\n` : ''}
            Mensaje:
            ${message}

            Este correo fue enviado desde el formulario de contacto de su sitio web.
        `;

        // Create HTML content for user thank you email
        const userHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>¡Gracias por contactarnos!</h2>
                <p>Estimado/a ${name},</p>
                <p>Hemos recibido tu mensaje y nos pondremos en contacto contigo lo antes posible.</p>
                <p>Para tu referencia, aquí está un resumen de tu mensaje:</p>
                <div style="background-color: #f4f4f4; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                <p>Si tienes alguna pregunta adicional, no dudes en responder a este correo.</p>
                <p>Saludos cordiales,<br>El equipo de MatchFloor</p>
            </div>
        `;

        // Plain text version as fallback for user
        const userText = `
            ¡Gracias por contactarnos!

            Estimado/a ${name},

            Hemos recibido tu mensaje y nos pondremos en contacto contigo lo antes posible.

            Para tu referencia, aquí está un resumen de tu mensaje:
            ${message}

            Si tienes alguna pregunta adicional, no dudes en responder a este correo.

            Saludos cordiales,
            El equipo de MatchFloor
        `;

        // Send both emails
        await Promise.all([
            // Send to admin
            this.sendMail({
                to: adminEmail,
                subject,
                text: adminText,
                html: adminHtml,
            }),
            // Send thank you to user
            this.sendMail({
                to: email,
                subject: '¡Gracias por contactarnos! - MatchFloor',
                text: userText,
                html: userHtml,
            }),
        ]);
    }

    async sendWelcomeEmail({ to, adminKey, widgetKey }: WelcomeEmail) {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Bienvenido a MatchFloor</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background-color: #f9f9f9;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-top: 30px; margin-bottom: 30px;">
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" bgcolor="#3498db" style="padding: 30px 0; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">¡Bienvenido a MatchFloor!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px 30px 20px 30px;">
                            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Gracias por unirte a MatchFloor. Estamos emocionados de tenerte con nosotros. A continuación encontrarás tus claves de API para integrar con tu sitio web:</p>
                            
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                                <h3 style="margin-top: 0; color: #2c3e50; font-size: 18px;">Tus claves de API</h3>
                                
                                <table width="100%" style="border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                                            <strong style="color: #3498db;">Clave de Administrador:</strong>
                                        </td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">
                                            <code style="background-color: #eee; padding: 3px 6px; border-radius: 4px; font-family: monospace; letter-spacing: 0.5px; word-break: break-all;">${adminKey}</code>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0;">
                                            <strong style="color: #3498db;">Clave de Widget:</strong>
                                        </td>
                                        <td style="padding: 10px 0; text-align: right;">
                                            <code style="background-color: #eee; padding: 3px 6px; border-radius: 4px; font-family: monospace; letter-spacing: 0.5px; word-break: break-all;">${widgetKey}</code>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">Recuerda mantener estas claves en un lugar seguro y no compartirlas con nadie.</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${envs.FRONTEND_URL}/login" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block; font-size: 16px;">Iniciar Sesión</a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Need Help Section -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <div style="background-color: #f0f7fb; border-left: 4px solid #3498db; padding: 15px; border-radius: 0 5px 5px 0;">
                                <h3 style="margin-top: 0; color: #2c3e50; font-size: 18px;">¿Necesitas ayuda?</h3>
                                <p style="font-size: 15px; line-height: 1.5; margin-bottom: 10px;">Para información detallada sobre cómo integrar nuestras herramientas, visita nuestra <a href="${envs.LANDING_URL}/documentacion" style="color: #3498db; text-decoration: none;">documentación</a>.</p>
                                <p style="font-size: 15px; line-height: 1.5; margin-bottom: 0;">Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos a <a href="mailto:soporte@matchfloor.com" style="color: #3498db; text-decoration: none;">soporte@matchfloor.com</a></p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" bgcolor="#ecf0f1" style="padding: 20px 30px; border-radius: 0 0 10px 10px; color: #7f8c8d; font-size: 14px;">
                            <p style="margin: 0;">© ${new Date().getFullYear()} MatchFloor. Todos los derechos reservados.</p>
                            <p style="margin: 10px 0 0 0;">
                                <a href="${envs.LANDING_URL}/privacidad" style="color: #3498db; text-decoration: none; margin: 0 10px;">Política de Privacidad</a> | 
                                <a href="${envs.LANDING_URL}/terminos" style="color: #3498db; text-decoration: none; margin: 0 10px;">Términos de Servicio</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        return this.sendMail({
            to,
            subject: 'Bienvenido a MatchFloor - Tus claves de API',
            text: `Bienvenido a MatchFloor. 

Tus claves de API:
- Clave de Administrador: ${adminKey}
- Clave de Widget: ${widgetKey}

Puedes utilizar la clave de Widget para integrar nuestro widget de propiedades en tu sitio web.
Para acceder a todas las funcionalidades, inicia sesión en tu panel de administración.

Si necesitas ayuda, contáctanos en soporte@matchfloor.com

El equipo de MatchFloor`,
            html,
        });
    }
}
