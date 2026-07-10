import { AuthGuard } from '@nestjs/passport';

export class PasswordResetAuthGuard extends AuthGuard('password-reset') {}
