import { AuthGuard } from '@nestjs/passport';

export class MemberSetPasswordTokenAuthGuard extends AuthGuard(
  'member-set-password-token',
) {}
