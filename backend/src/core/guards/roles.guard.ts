import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

// * auth guard is a class used to protect routes by verifying user authentication before granting access
// * CanActivate is an interface that forces the class to implement the canActivate() method used for authorization logic
// * context: ExecutionContext is a wrapper around the details of the current request execution (contains metadata about the request)
// * reflector is a NestJS helper class used to read metadata added by decorators (e.g. @Roles())
// * getAllAndOverride() is a Reflector method that retrieves metadata from both method and controller levels, where method metadata overrides controller metadata
// * reflector.get() reads metadata from a single level (only method OR only controller) it does NOT merge or override multiple sources, so it may miss controller-level or method-level inheritance
// * getHandler() is a method that returns the current route handler (controller method, e.g findAll)
// * getClass() is a method that returns the current controller class
// * switchToHttp() is a method to access the HTTP layer of the execution context (e.g., req, res)
// * getRequest() is a method to retrieve the actual HTTP request object (express.Request)
@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    // * Get roles from @Roles() decorator metadata
    const roles: Role[] = this.reflector.getAllAndOverride(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);

    // * If no @Roles() decorator — route is open to all authenticated users
    if (!roles || roles.length === 0) {
      return true;
    }

    // * Get user from request (set by AuthGuard)
    const request: Request = context.switchToHttp().getRequest();
    const user = request['user'] as AccessTokenPayload;

    // * Check if user's role is in the allowed roles
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource.',
      );
    }
    return true;
  }
}
