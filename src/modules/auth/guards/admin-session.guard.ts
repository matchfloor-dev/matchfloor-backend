import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class AdminSessionGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly reflector: Reflector,
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
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET,
            });

            if (!payload) {
                console.log('Invalid token');
                throw new UnauthorizedException('Invalid token');
            }

            if (
                request.params.adminId &&
                Number(request.params.adminId) !== Number(payload.id)
            ) {
                console.log(
                    `Unauthorized adminId: ${payload.id} != ${request.params.adminId}`,
                );
                throw new UnauthorizedException('Unauthorized adminId');
            }

            if (payload.role !== 'admin') {
                console.log('Unauthorized role');
                throw new UnauthorizedException('Unauthorized role');
            }

            request['adminId'] = payload.id;
            return true;
        } catch (error) {
            console.error(error);
            throw new UnauthorizedException();
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        if(!request.headers.authorization) return undefined;
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
