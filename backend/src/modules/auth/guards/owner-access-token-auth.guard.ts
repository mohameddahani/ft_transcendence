import { AuthGuard } from '@nestjs/passport';

export class OwnerAccessTokenAuthGuard extends AuthGuard(
  'owner-access-token',
) {}
