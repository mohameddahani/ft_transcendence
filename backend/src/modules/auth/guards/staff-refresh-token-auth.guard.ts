import { AuthGuard } from '@nestjs/passport';

export class StaffRefreshTokenAuthGuard extends AuthGuard(
  'staff-refresh-token',
) {}
