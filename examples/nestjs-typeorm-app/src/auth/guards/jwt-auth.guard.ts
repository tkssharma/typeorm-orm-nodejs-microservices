import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly jwtSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET', 'your-secret-key');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.debug('No token found in request header');
      throw new UnauthorizedException('No token provided');
    }

    try {
      this.logger.debug('Validating JWT token');
      const decoded = jwt.verify(token, this.jwtSecret);
      const payload = decoded as unknown as JwtPayload;
      this.logger.debug(`Token valid for user ID: ${payload.sub}`);

      // Attach user payload to request for use in controllers
      (request as any).user = payload;
      return true;
    } catch (error) {
      this.logger.debug(`Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
