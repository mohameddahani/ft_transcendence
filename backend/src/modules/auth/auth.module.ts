import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthProvider } from './auth.provider';
import { PassportModule } from '@nestjs/passport';
import { EmailModule } from '@/infrastructure/email/email.module';
import { CustomJwtModule } from './jwt/jwt.module';
import { EmailVerificationStrategy } from './strategies/email-verification.strategy';
import { PasswordResetStrategy } from './strategies/password-reset.strategy';
import { AdminRefreshTokenStrategy } from './strategies/admin-refresh-token.strategy';
import { AdminAccessTokenStrategy } from './strategies/admin-access-token.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthProvider,
    EmailVerificationStrategy,
    PasswordResetStrategy,
    AdminRefreshTokenStrategy,
    AdminAccessTokenStrategy,
  ],
  imports: [PassportModule, EmailModule, CustomJwtModule],
  exports: [],
})
export class AuthModule {}
