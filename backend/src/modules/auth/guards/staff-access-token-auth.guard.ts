import { AuthGuard } from '@nestjs/passport';

export class StaffAccessTokenAuthGuard extends AuthGuard(
  'staff-access-token',
) {}
