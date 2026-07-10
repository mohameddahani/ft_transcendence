import { AuthGuard } from '@nestjs/passport';

// * AuthGuard(): is a factory function that creates a NestJS guard
// * for a specific Passport strategy and returns a guard class that
// * can be extended or used directly.

// * 'email-verification': is the name of the Passport strategy to use.
// * When this guard is applied, Passport executes the
// * EmailVerificationStrategy to authenticate the request.

// * If authentication succeeds, the value returned from validate()
// * is attached to request.user. Otherwise, an UnauthorizedException
// * is automatically thrown.
export class EmailVerificationAuthGuard extends AuthGuard(
  'email-verification',
) {}
