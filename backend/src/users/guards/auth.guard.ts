import { JWTPayload } from '@/utils/types';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// * auth guard is a class used to protect routes by verifying user authentication before granting access
// * CanActivate is an interface that forces the class to implement the canActivate() method used for authorization logic
// * context: ExecutionContext is a wrapper around the details of the current request execution (contains metadata about the request)
// * switchToHttp() is a method to access the HTTP layer of the execution context (e.g., req, res)
// * getRequest() is a method to retrieve the actual HTTP request object (express.Request)
// * verifyAsync() is a method from JwtService that verifies and decodes a JWT token asynchronously to extract the payload (is take the token and the secretKey)
// * UnauthorizedException() is an exception thrown to indicate that the request is unauthorized (returns 401 Unauthorized)
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext) {
    // * Get request
    const request: Request = context.switchToHttp().getRequest();
    // * Get token
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (token && type === 'Bearer') {
      try {
        // * Check if token is valid
        const payload: JWTPayload = await this.jwtService.verifyAsync(token, {
          secret: this.config.getOrThrow<string>('JWT_SECRET'),
        });
        // * adding a property to the request object (user) after checking the token
        request['user'] = payload;
      } catch {
        throw new UnauthorizedException('Access Denied, Invalid Token');
      }
    } else {
      throw new UnauthorizedException('Access Denied, No Token Provided');
    }
    return true;
  }
}
