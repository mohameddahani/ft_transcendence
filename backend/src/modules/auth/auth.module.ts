import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthProvider } from './auth.provider';
import { PassportModule } from '@nestjs/passport';
import { EmailModule } from '@/infrastructure/email/email.module';
import { CustomJwtModule } from './jwt/jwt.module';
import { EmailVerificationTokenStrategy } from './strategies/email-verification-token.strategy';
import { AdminResetPasswordStrategy } from './strategies/admin-reset-password.strategy';
import { AdminRefreshTokenStrategy } from './strategies/admin-refresh-token.strategy';
import { AdminAccessTokenStrategy } from './strategies/admin-access-token.strategy';
import { OwnerAccessTokenStrategy } from './strategies/owner-access-token.strategy';
import { OwnerRefreshTokenStrategy } from './strategies/owner-refresh-token.strategy';
import { MemberAccessTokenStrategy } from './strategies/member-access-token.strategy';
import { MemberRefreshTokenStrategy } from './strategies/member-refresh-token.strategy';
import { MemberSetPasswordTokenStrategy } from './strategies/member-set-password-token.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthProvider,
    EmailVerificationTokenStrategy,
    AdminResetPasswordStrategy,
    OwnerAccessTokenStrategy,
    OwnerRefreshTokenStrategy,
    AdminRefreshTokenStrategy,
    AdminAccessTokenStrategy,
    MemberAccessTokenStrategy,
    MemberRefreshTokenStrategy,
    MemberSetPasswordTokenStrategy,
  ],
  imports: [PassportModule, EmailModule, CustomJwtModule],
  exports: [],
})
export class AuthModule {}
