import { AuthGuard } from '@nestjs/passport';

export class AdminRefreshTokenAuthGuard extends AuthGuard(
  'admin-refresh-token',
) {}
