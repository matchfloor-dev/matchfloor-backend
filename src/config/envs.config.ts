import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    PORT: number;
    NODE_ENV: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    JWT_SECRET: string;
    DEFAULT_ADMIN_NAME: string;
    DEFAULT_ADMIN_LAST_NAME: string;
    DEFAULT_ADMIN_EMAIL: string;
    DEFAULT_ADMIN_PASSWORD: string;
    FRONTEND_URL: string;
    LANDING_URL: string;
    EMAIL_SENDER: string;
    EMAIL_PASSWORD: string;
    EMAIL_HOST: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    CLOUDINARY_UPLOAD_PRESET: string;
    STRIPE_SECRET: string;
    STRIPE_SUCCESS_URL: string;
    STRIPE_CANCEL_URL: string;
    STRIPE_ENDPOINT_SECRET: string;
}

const envVarsSchema = joi
    .object({
        PORT: joi.number().default(4000),
        NODE_ENV: joi.string().required(),
        DB_HOST: joi.string().required(),
        DB_PORT: joi.number().required(),
        DB_NAME: joi.string().required(),
        DB_USER: joi.string().required(),
        DB_PASSWORD: joi.string().required(),
        JWT_SECRET: joi.string().required(),
        DEFAULT_ADMIN_NAME: joi.string().default('Admin'),
        DEFAULT_ADMIN_LAST_NAME: joi.string().default('Admin'),
        DEFAULT_ADMIN_EMAIL: joi.string().default('admin@matchfloor.com'),
        DEFAULT_ADMIN_PASSWORD: joi.string(),
        FRONTEND_URL: joi.string().required(),
        LANDING_URL: joi.string().required(),
        EMAIL_SENDER: joi.string().required(),
        EMAIL_PASSWORD: joi.string().required(),
        EMAIL_HOST: joi.string().required(),
        CLOUDINARY_CLOUD_NAME: joi.string().required(),
        CLOUDINARY_API_KEY: joi.string().required(),
        CLOUDINARY_API_SECRET: joi.string().required(),
        CLOUDINARY_UPLOAD_PRESET: joi.string().required(),
        STRIPE_SECRET: joi.string().required(),
        STRIPE_SUCCESS_URL: joi.string().required(),
        STRIPE_CANCEL_URL: joi.string().required(),
        STRIPE_ENDPOINT_SECRET: joi.string().required(),
    })
    .unknown(true);

const { error, value } = envVarsSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
    PORT: envVars.PORT,
    NODE_ENV: envVars.NODE_ENV,
    DB_HOST: envVars.DB_HOST,
    DB_PORT: envVars.DB_PORT,
    DB_NAME: envVars.DB_NAME,
    DB_USER: envVars.DB_USER,
    DB_PASSWORD: envVars.DB_PASSWORD,
    JWT_SECRET: envVars.JWT_SECRET,
    DEFAULT_ADMIN_NAME: envVars.DEFAULT_ADMIN_NAME,
    DEFAULT_ADMIN_LAST_NAME: envVars.DEFAULT_ADMIN_LAST_NAME,
    DEFAULT_ADMIN_EMAIL: envVars.DEFAULT_ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD: envVars.DEFAULT_ADMIN_PASSWORD,
    FRONTEND_URL: envVars.FRONTEND_URL,
    LANDING_URL: envVars.LANDING_URL,
    EMAIL_SENDER: envVars.EMAIL_SENDER,
    EMAIL_PASSWORD: envVars.EMAIL_PASSWORD,
    EMAIL_HOST: envVars.EMAIL_HOST,
    CLOUDINARY_CLOUD_NAME: envVars.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: envVars.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: envVars.CLOUDINARY_API_SECRET,
    CLOUDINARY_UPLOAD_PRESET: envVars.CLOUDINARY_UPLOAD_PRESET,
    stripeSecret: envVars.STRIPE_SECRET,
    stripeSuccessUrl: envVars.STRIPE_SUCCESS_URL,
    stripeCancelUrl: envVars.STRIPE_CANCEL_URL,
    stripeEndpointSecret: envVars.STRIPE_ENDPOINT_SECRET,
};
