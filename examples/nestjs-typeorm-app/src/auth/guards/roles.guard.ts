import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../auth.service';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      this.logger.debug('No roles required for this route');
      return true;
    }

    this.logger.debug(`Required roles: ${requiredRoles.join(', ')}`);

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      this.logger.debug('No user found in request');
      throw new ForbiddenException('Access denied');
    }

    this.logger.debug(`User role: ${user.role}`);
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.debug(`User ${user.email} does not have required role`);
      throw new ForbiddenException('Insufficient permissions');
    }

    this.logger.debug(`User ${user.email} has required role`);
    return true;
  }
}
