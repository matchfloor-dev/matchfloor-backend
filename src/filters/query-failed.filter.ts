import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Request, Response } from 'express';

@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
    catch(exception: QueryFailedError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = HttpStatus.BAD_REQUEST;

        const isProd = process.env.NODE_ENV !== 'development';

        let errorMessage = 'Internal Server Error';
        if (!isProd) {
            errorMessage = exception.message;
        } else {
            if (exception.message.includes('Duplicate entry')) {
                if (exception.message.includes('@')) {
                    errorMessage = 'ERR_EMAIL_ALREADY_EXISTS';
                }
            } else if (exception.message.includes('foreign key constraint')) {
                errorMessage = 'Foreign key constraint error';
            }
            // Add more if needed
        }

        response.status(status).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            path: request.url,
            message: exception.message,
            errors: [errorMessage],
        });
    }
}
