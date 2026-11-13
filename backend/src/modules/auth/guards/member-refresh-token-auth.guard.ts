import { AuthGuard } from '@nestjs/passport';

export class MemberRefreshTokenAuthGuard extends AuthGuard(
  'member-refresh-token',
) {}
