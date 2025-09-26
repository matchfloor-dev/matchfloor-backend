import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';

// import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
// import { JwtRoles } from '../enums/roles.enum';
import { AgenciesService } from 'src/modules/agencies/agencies.service';
@Injectable()
export class WebhookSessionGuard implements CanActivate {
    constructor(
        // private readonly jwtService: JwtService,
        private readonly reflector: Reflector,

        private readonly agenciesService: AgenciesService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            console.log('No token provided');
            throw new UnauthorizedException('No token provided');
        }

        try {
            const agency = await this.agenciesService.getByWebhookToken(token);

            if (!agency) {
                console.log('Invalid token');
                throw new UnauthorizedException('Invalid token');
            }

            request['agencyId'] = agency.id;
            return true;
        } catch (error) {
            console.error(error);
            throw new UnauthorizedException('Unauthorized');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        if(!request.headers.authorization) return undefined;
        const [type, token] = request.headers.authorization.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
