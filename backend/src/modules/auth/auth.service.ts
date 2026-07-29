import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthProvider } from './auth.provider';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '@/core/types/jwt-payload.type';
import { Request } from 'express';
import { LoginMemberDto } from './dto/login-member.dto';
import { SetPasswordMemberDto } from './dto/set-password-member.dto';

@Injectable()
export class AuthService {
  constructor(private readonly authProvider: AuthProvider) {}

  // * Register
  register(data: RegisterUserDto) {
    return this.authProvider.register(data);
  }

  // * Login
  login(request: Request, data: LoginUserDto) {
    return this.authProvider.login(request, data);
  }

  // * Login Member
  loginMember(request: Request, data: LoginMemberDto) {
    return this.authProvider.loginMember(request, data);
  }

  // * Set Password Member
  setPasswordMember(
    accessTokenPayload: AccessTokenPayload,
    data: SetPasswordMemberDto,
  ) {
    return this.authProvider.setPasswordMember(accessTokenPayload, data);
  }

  // * Refresh
  refresh(refreshToken: string, refreshTokenPayload: RefreshTokenPayload) {
    return this.authProvider.refresh(refreshToken, refreshTokenPayload);
  }

  // * Refresh Member
  refreshMember(
    refreshToken: string,
    refreshTokenPayload: RefreshTokenPayload,
  ) {
    return this.authProvider.refreshMember(refreshToken, refreshTokenPayload);
  }

  // * Activate user account
  activateAccount(accessTokenPayload: AccessTokenPayload) {
    return this.authProvider.activateAccount(accessTokenPayload);
  }

  // * Forgot password
  forgotPassword(email: string) {
    return this.authProvider.forgotPassword(email);
  }

  // * Password reset
  resetPassword(accessTokenPayload: AccessTokenPayload, password: string) {
    return this.authProvider.resetPassword(accessTokenPayload, password);
  }
}
