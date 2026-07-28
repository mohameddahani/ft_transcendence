import { AuthGuard } from '@nestjs/passport';

export class ResetPasswordAuthGuard extends AuthGuard('reset-password') {}
