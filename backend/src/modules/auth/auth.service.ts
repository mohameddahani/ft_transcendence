import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthProvider } from './auth.provider';
import { RefreshTokenPayload } from '@/core/types/jwt-payload.type';
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

  // * Logout (Admin)
  logoutAdmin(refreshToken: string, refreshTokenPayload: RefreshTokenPayload) {
    return this.authProvider.logoutAdmin(refreshToken, refreshTokenPayload);
  }

  // * Login Member
  loginMember(request: Request, data: LoginMemberDto) {
    return this.authProvider.loginMember(request, data);
  }

  // * Set Password Member
  setPasswordMember(rawToken: string, data: SetPasswordMemberDto) {
    return this.authProvider.setPasswordMember(rawToken, data);
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
  activateAccount(rawToken: string) {
    return this.authProvider.activateAccount(rawToken);
  }

  // * Forgot password
  forgotPassword(email: string) {
    return this.authProvider.forgotPassword(email);
  }

  // * Password reset
  resetPassword(rawToken: string, password: string) {
    return this.authProvider.resetPassword(rawToken, password);
  }

  // * Forgot password (Member)
  forgotPasswordMember(username: string) {
    return this.authProvider.forgotPasswordMember(username);
  }

  // * Password reset (Member)
  resetPasswordMember(rawToken: string, password: string) {
    return this.authProvider.resetPasswordMember(rawToken, password);
  }
}
