import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Log } from './log.entity';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger = new Logger('HTTP');

    // constructor(
    //     @InjectRepository(Log)
    //     private logRepository: Repository<Log>,
    //   ) {}

    use(req: Request, response: Response, next: NextFunction): void {
      const { method, originalUrl, body } = req;
       
        try {
            const request = JSON.stringify(body);
            this.logger.log(
                `${method} ${originalUrl} - request : ${request}`, //  - response : ${responseBody}`,
            );
            // const logEntry = this.logRepository.create({
            //     url: originalUrl,
            //     //statusCode: statusCode,
            //     statusCode: 0,
            //     method: method,
            //     request: request,
            //     response: "No log",
            //     responseTime: "No log", //`${responseTime}ms`,
            //     ip: req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].toString() : req.ip,
            //     host: req.headers.origin,
            //     userAgent: req.headers['user-agent']
            // });
            // this.logRepository.save(logEntry).then();
        } catch(error){
            console.log(error);
        }
  
      next();
    }
}