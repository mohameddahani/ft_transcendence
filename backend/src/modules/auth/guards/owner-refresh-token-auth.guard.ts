import { AuthGuard } from '@nestjs/passport';

export class OwnerRefreshTokenAuthGuard extends AuthGuard(
  'owner-refresh-token',
) {}
