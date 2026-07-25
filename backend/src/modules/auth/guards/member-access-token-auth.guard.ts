import { AuthGuard } from '@nestjs/passport';

export class MemberAccessTokenAuthGuard extends AuthGuard(
  'member-access-token',
) {}
