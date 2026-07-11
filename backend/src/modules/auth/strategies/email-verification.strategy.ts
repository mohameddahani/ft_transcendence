import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// * Passport: is an authentication middleware for Node.js that delegates
// * authentication to different strategies (Local, JWT, OAuth, Google, etc.).

// * Strategy: is the Passport JWT Strategy responsible for extracting,
// * verifying, and validating JSON Web Tokens (JWTs).

// * PassportStrategy(): is a function that wraps a Passport strategy,
// * registers it as a NestJS provider with dependency injection support,
// * and returns a class that can be extended.

// * super(): calls the parent Strategy constructor to configure how
// * the JWT is extracted and verified before authentication begins.

// * ExtractJwt: is a Passport helper that provides built-in methods
// * for extracting JWTs from different locations in an HTTP request
// * (headers, cookies, query parameters, body, etc.).

// * jwtFromRequest: specifies where Passport should extract the JWT
// * from the incoming request.

// * ExtractJwt.fromAuthHeaderAsBearerToken(): extracts the JWT from
// * the Authorization header using the Bearer scheme.
//
// * Authorization: Bearer <jwt>

// * ExtractJwt.fromUrlQueryParameter('token'): extracts the JWT from
// * the "token" query parameter.
//
// * Example:
// * GET /verify-email?token=<jwt>

// * ignoreExpiration: determines whether Passport should validate
// * the token's expiration time. Setting it to false rejects expired tokens.

// * secretOrKey: specifies the secret (or public key) used to verify
// * the JWT signature.

// * validate(): is automatically called after the JWT has been
// * successfully extracted and verified. The returned value is attached
// * to request.user and becomes available throughout the request lifecycle.

@Injectable()
export class EmailVerificationStrategy extends PassportStrategy(
  Strategy,
  'email-verification',
) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter('token'),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>(
        'JWT_ADMIN_EMAIL_VERIFICATION_SECRET',
      ),
    });
  }

  validate(payload: AccessTokenPayload) {
    return payload;
  }
}
