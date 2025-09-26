import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
} from '@nestjs/common';
import { isObject } from 'class-validator';
import { Request, Response } from 'express';

const filterErrors = (errors: string[] | string): string[] => {
    if(typeof errors === 'string') return [errors];

    return errors.filter((error: string) => error.startsWith('ERR_'));
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        console.log('exception', exception);
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();

        const exceptionRes = exception.getResponse();
        const isProd = process.env.NODE_ENV !== 'development';
        console.log('isProd: ', isProd)

        response.status(status).json({
            status: `${status}`.startsWith('4') ? 'error' : 'fail',
            timestamp: new Date().toISOString(),
            path: request.url,
            message: isProd
                ? exception.message
                : isObject(exceptionRes)
                  ? exceptionRes['error']
                  : exceptionRes,
            errors: isObject(exceptionRes)
                ? filterErrors(exceptionRes['message'])
                : null,
        });
    }
}
