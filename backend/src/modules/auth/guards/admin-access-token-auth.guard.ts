import { AuthGuard } from '@nestjs/passport';

export class AdminAccessTokenAuthGuard extends AuthGuard(
  'admin-access-token',
) {}
