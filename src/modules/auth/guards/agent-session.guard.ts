import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class AgentSessionGuard implements CanActivate {
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

            // if the role is admin, the user is authorized
            if (payload.role === 'admin') {
                return true;
            }

            // if the role is agency and the agencyId matches the url param, the user is authorized
            if (payload.role === 'agency') {
                if (
                    request.params.agencyId &&
                    Number(request.params.agencyId) !== Number(payload.id)
                ) {
                    console.log(
                        `Unauthorized agencyId: ${payload.id} != ${request.params.agencyId}`,
                    );
                    throw new UnauthorizedException('Unauthorized agencyId');
                }
                return true;
            }

            if (
                request.params.agentId &&
                Number(request.params.agentId) !== Number(payload.id)
            ) {
                console.log(
                    `Unauthorized agentId: ${payload.id} != ${request.params.agentId}`,
                );
                throw new UnauthorizedException('Unauthorized agentId');
            }

            if (payload.role !== 'agent') {
                console.log('Unauthorized role');
                throw new UnauthorizedException('Unauthorized role');
            }

            request['agentId'] = payload.id;
            return true;
        } catch (error) {
            console.error(error);
            throw new UnauthorizedException('Invalid token');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        if(!request.headers.authorization) return undefined;
        const [type, token] = request.headers.authorization.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
