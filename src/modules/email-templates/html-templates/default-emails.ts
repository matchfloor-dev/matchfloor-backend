import { defaultHtmls } from './base.template';

// enum
import { Langs } from 'src/shared/enum/languages.enum';
import { EmailTemplatesCases } from '../enum/email-templates-cases.enum';

export const defaultEmails = [
    {
        case: EmailTemplatesCases.APPOINTMENT_RECIVED,
        subject: 'Nueva cita',
        message: 'Nueva cita',
        variables: [
            {
                clientName: '{{ CLIENT_NAME }}',
                clientMail: '{{ CLIENT_MAIL }}',
                day: '{{ DAY }}',
                hour: '{{ HOUR }}',
                residenceName: '{{ RESIDENCE_NAME }}',
                agentName: '{{ AGENT_NAME }}',
                agentMail: '{{ AGENT_MAIL }}',
            },
        ],
        html: defaultHtmls(EmailTemplatesCases.APPOINTMENT_RECIVED),
        lang: Langs.ES,
    },
    {
        case: EmailTemplatesCases.SCHEDULE_APPOINTMENT_API,
        subject: 'Programar cita',
        message: 'Programar cita',
        variables: [
            {
                agentName: '{{ AGENT_NAME }}',
                clientName: '{{ CLIENT_NAME }}',
                clientMail: '{{ CLIENT_MAIL }}',
                phone: '{{ PHONE }}',
                day: '{{ DAY }}',
                hour: '{{ HOUR }}',
                notes: '{{ NOTES }}',
                homeName: '{{ HOME_NAME }}',
                agentConfirmToken: '{{ CONFIRM_TOKEN }}',
                agentCancelToken: '{{ CANCEL_TOKEN }}',
                rescheduleToken: '{{ RESCHEDULE_TOKEN }}',
            },
        ],
        html: defaultHtmls(EmailTemplatesCases.SCHEDULE_APPOINTMENT_API),
        lang: Langs.ES,
    },
    {
        case: EmailTemplatesCases.APPOINTMENT_REJECTED_API_TO_CLIENT,
        subject: 'Cita rechazada',
        message: 'Cita rechadaza',
        variables: [
            {
                clientName: '{{ CLIENT_NAME }}',
                day: '{{ DAY }}',
                hour: '{{ HOUR }}',
                residenceName: '{{ RESIDENCE_NAME }}',
                agencyName: '{{ AGENCY_NAME }}',
            },
        ],
        html: defaultHtmls(
            EmailTemplatesCases.APPOINTMENT_REJECTED_API_TO_CLIENT,
        ),
        lang: Langs.ES,
    },
    {
        case: EmailTemplatesCases.CONFIRM_APPOINTMENT_API_TO_OWNER,
        subject: 'Nueva cita confirmación propietario',
        message: 'Cita propietario',
        variables: [
            {
                day: '{{ DAY }}',
                hour: '{{ HOUR }}',
                residenceName: '{{ RESIDENCE_NAME }}',
                agencyName: '{{ AGENCY_NAME }}',
                ownerConfirmToken: '{{ CONFIRM_TOKEN }}',
                ownerCancelToken: '{{ CANCEL_TOKEN }}',
            },
        ],
        html: defaultHtmls(
            EmailTemplatesCases.CONFIRM_APPOINTMENT_API_TO_OWNER,
        ),
        lang: Langs.ES,
    },

    {
        case: EmailTemplatesCases.CANCEL_OWNER_APPOINTMENT,
        subject: 'Cancelar cita propietario',
        message: 'Cancelar cita propietario',
        vairables: [
            {
                clientName: '{{ FULL_NAME }}',
                agentName: '{{ FULL_NAME }}',
                residenceName: '{{ RESIDENCE_NAME }}',
                day: '{{ DAY }}',
                hour: '{{ HOUR }}',
                agencyName: '{{ AGENCY_NAME }}',
            },
        ],
        html: defaultHtmls(EmailTemplatesCases.CANCEL_OWNER_APPOINTMENT),
        lang: Langs.ES,
    },
    {
        case: EmailTemplatesCases.APPOINTMENT_ACCEPTED,
        subject: 'Cita aceptada',
        message: 'Cit aceptada',
        variables: [
            {
                clientName: '{{ FULL_NAME }}',
                agentName: '{{ FULL_NAME }}',
                residenceName: '{{ RESIDENCE_NAME }}',
                day: '{{ DAY }}',
                hour: '{{ HOUR }}',
                agencyName: '{{ AGENCY_NAME }}',
            },
        ],
        html: defaultHtmls(EmailTemplatesCases.APPOINTMENT_ACCEPTED),
        lang: Langs.ES,
    },
    {
        case: EmailTemplatesCases.APPOINTMENT_REMINDER,
        subject: 'Recordatorio de cita',
        message: 'Recordatorio de cita',
        variables: [
            {
                clientName: '{{ CLIENT_NAME }}',
                residenceName: '{{ RESIDENCE_NAME }}',
                day: '{{ DAY }}',
                hour: '{{ HOUR }}',
                agencyName: '{{ AGENCY_NAME }}',
                clientConfirmToken: '{{ CONFIRM_TOKEN }}',
                clientCancelToken: '{{ CANCEL_TOKEN }}',
            },
        ],
        html: defaultHtmls(EmailTemplatesCases.APPOINTMENT_REMINDER),
        lang: Langs.ES,
    },
    {
        case: EmailTemplatesCases.APPOINTMENT_CLIENT_CANCELED,
        subject: 'Cancelación de cita por parte del cliente',
        message: 'Cancelación de cita por parte del cliente',
        variables: [
            {
                clientName: '{{ FULL_NAME }}',
                agentName: '{{ FULL_NAME }}',
                residenceName: '{{ RESIDENCE_NAME }}',
                day: '{{ DAY }}',
                hour: '{{ HOUR }}',
                agencyName: '{{ AGENCY_NAME }}',
            },
        ],
        html: defaultHtmls(EmailTemplatesCases.APPOINTMENT_CLIENT_CANCELED),
        lang: Langs.ES,
    },
    {
        case: EmailTemplatesCases.RESCHEDULE_APPOINTMENT,
        subject: 'Reprogramar cita',
        message: 'Reprogramar cita',
        variables: [
            {
                clientName: '{{ CLIENT_NAME }}',
                residenceName: '{{ RESIDENCE_NAME }}',
                day: '{{ DAY }}',
                hour: '{{ HOUR }}',
                agencyName: '{{ AGENCY_NAME }}',
                clientConfirmToken: '{{ CONFIRM_TOKEN }}',
                clientCancelToken: '{{ CANCEL_TOKEN }}',
            },
        ],
        html: defaultHtmls(EmailTemplatesCases.RESCHEDULE_APPOINTMENT),
        lang: Langs.ES,
    },
    {
        case: EmailTemplatesCases.APPOINTMENT_REMINDER_AGENT_OWNER,
        subject: 'Recordatorio de cita',
        message: 'Recordatorio de cita',
        variables: [
            {
                name: '{{ NAME }}',
                clientName: '{{ CLIENT_NAME }}',
                residenceName: '{{ RESIDENCE_NAME }}',
                day: '{{ DAY }}',
                hour: '{{ HOUR }}',
                agencyName: '{{ AGENCY_NAME }}',
            },
        ],
        html: defaultHtmls(
            EmailTemplatesCases.APPOINTMENT_REMINDER_AGENT_OWNER,
        ),
        lang: Langs.ES,
    },
];
