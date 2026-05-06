import { UserType } from '@/generated/prisma/enums';
import { JWTPayload } from '@/utils/types';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

// * auth guard is a class used to protect routes by verifying user authentication before granting access
// * CanActivate is an interface that forces the class to implement the canActivate() method used for authorization logic
// * context: ExecutionContext is a wrapper around the details of the current request execution (contains metadata about the request)
// * switchToHttp() is a method to access the HTTP layer of the execution context (e.g., req, res)
// * getRequest() is a method to retrieve the actual HTTP request object (express.Request)
// * verifyAsync() is a method from JwtService that verifies and decodes a JWT token asynchronously to extract the payload (is take the token and the secretKey)
// * UnauthorizedException() is an exception thrown to indicate that the request is unauthorized (returns 401 Unauthorized)
@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor() {}
  canActivate(context: ExecutionContext) {
    // * Get request
    const request: Request = context.switchToHttp().getRequest();

    // * Get header of user (payload of user)
    const user = request['user'] as JWTPayload;

    // * Check type of user
    if (user?.userType !== UserType.admin) {
      throw new ForbiddenException('Access Denied, Admins Only');
    }
    return true;
  }
}
