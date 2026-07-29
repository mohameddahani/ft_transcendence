import { AuthGuard } from '@nestjs/passport';

export class AdminResetPasswordAuthGuard extends AuthGuard(
  'admin-reset-password',
) {}
