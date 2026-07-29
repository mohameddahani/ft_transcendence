import { AuthGuard } from '@nestjs/passport';

export class EmailVerificationTokenAuthGuard extends AuthGuard(
  'email-verification-token',
) {}
