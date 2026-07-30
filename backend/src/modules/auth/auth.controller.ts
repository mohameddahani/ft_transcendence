import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import type { RefreshTokenPayload } from '@/core/types/jwt-payload.type';
import { ForgotPasswordUserDto } from './dto/forgot-password-user.dto';
import { ResetPasswordUserDto } from './dto/reset-passworf-user.dto';
import type { Request, Response } from 'express';
import { GetCookies } from '@/core/decorators/get-cookies.decorator';
import ms from 'ms';
import { AdminRefreshTokenAuthGuard } from './guards/admin-refresh-token-auth.guard';
import { GetRefreshTokenPayload } from '@/core/decorators/get-refresh-token-payload.decorator';
import { AdminAccessTokenAuthGuard } from './guards/admin-access-token-auth.guard';
import { OwnerRefreshTokenAuthGuard } from './guards/owner-refresh-token-auth.guard';
import { LoginMemberDto } from './dto/login-member.dto';
import { MemberRefreshTokenAuthGuard } from './guards/member-refresh-token-auth.guard';
import { SetPasswordMemberDto } from './dto/set-password-member.dto';
import { ForgotPasswordMemberDto } from './dto/forgot-password-member.dto';
import { ResetPasswordMemberDto } from './dto/reset-password-member.dto';
import { QueryTokenDto } from './dto/query-token.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* 
  =========================
  ! Admin / Owner Auth
  =========================
  */

  // * Register
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 600_000 } }) // * Set Rate Limiting (5 req / 10 min)
  register(@Body() body: RegisterUserDto) {
    return this.authService.register(body);
  }

  // * Login
  @Post('login')
  @HttpCode(HttpStatus.OK) // * set default status code
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() body: LoginUserDto,
    @Req() request: Request,
    // * passthrough: true: Let me access and modify the response object, but NestJS should still handle sending the response automatically
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, accessToken, refreshToken, refreshExpiresIn } =
      await this.authService.login(request, body);

    // * Store the refresh token in a secure HttpOnly cookie
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true, // * Prevent JavaScript from accessing the cookie (protects against XSS)
      secure: process.env.NODE_ENV === 'production', // * Send the cookie only over HTTPS in production
      sameSite: 'strict', // * Prevent the cookie from being sent with cross-site requests (protects against CSRF)
      path: '/api/auth/refresh', // * Send only to the refresh endpoint
      maxAge: ms(refreshExpiresIn), // * Expires after 30 days
    });

    return { user, accessToken };
  }

  // * Logout
  @Post('logout')
  @HttpCode(HttpStatus.OK) // * set default status code
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(AdminAccessTokenAuthGuard)
  logout() {
    // return this.authService.refresh(refreshToken, refreshTokenPayload);
  }

  // * Activate user account
  @Post('email-verification')
  @Throttle({ default: { limit: 10, ttl: 3600_000 } })
  activateAccount(@Query() rawToken: QueryTokenDto) {
    return this.authService.activateAccount(rawToken.token);
  }

  // * Forgot password
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK) // * set default status code
  @Throttle({ default: { limit: 3, ttl: 3600_000 } }) // * Set Rate Limiting (3 req / 1h)
  forgotPassword(@Body() Body: ForgotPasswordUserDto) {
    return this.authService.forgotPassword(Body.email);
  }

  // * Password reset
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 3600_000 } })
  resetPassword(
    @Query() rawToken: QueryTokenDto,
    @Body() body: ResetPasswordUserDto,
  ) {
    return this.authService.resetPassword(rawToken.token, body.password);
  }

  /* 
  =========================
  ! Admin / Owner / Member Refresh
  =========================
  */

  // * Refresh Admin
  @Post('refresh/admin')
  @HttpCode(HttpStatus.OK) // * set default status code
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(AdminRefreshTokenAuthGuard)
  refreshAdmin(
    @GetCookies('refresh_token') refreshToken: string,
    @GetRefreshTokenPayload() refreshTokenPayload: RefreshTokenPayload,
  ) {
    return this.authService.refresh(refreshToken, refreshTokenPayload);
  }

  // * Refresh Owner
  @Post('refresh/owner')
  @HttpCode(HttpStatus.OK) // * set default status code
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(OwnerRefreshTokenAuthGuard)
  refreshOwner(
    @GetCookies('refresh_token') refreshToken: string,
    @GetRefreshTokenPayload() refreshTokenPayload: RefreshTokenPayload,
  ) {
    return this.authService.refresh(refreshToken, refreshTokenPayload);
  }

  // * Refresh Member
  @Post('refresh/member')
  @HttpCode(HttpStatus.OK) // * set default status code
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(MemberRefreshTokenAuthGuard)
  refreshMember(
    @GetCookies('refresh_token') refreshToken: string,
    @GetRefreshTokenPayload() refreshTokenPayload: RefreshTokenPayload,
  ) {
    return this.authService.refreshMember(refreshToken, refreshTokenPayload);
  }

  /* 
  =========================
  ! Member Auth
  =========================
  */
  // * Login Member
  @Post('/members/login')
  @HttpCode(HttpStatus.OK) // * set default status code
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async loginMember(
    @Body() body: LoginMemberDto,
    @Req() request: Request,
    // * passthrough: true: Let me access and modify the response object, but NestJS should still handle sending the response automatically
    @Res({ passthrough: true }) response: Response,
  ) {
    const { member, accessToken, refreshToken, refreshExpiresIn } =
      await this.authService.loginMember(request, body);

    // * Store the refresh token in a secure HttpOnly cookie
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true, // * Prevent JavaScript from accessing the cookie (protects against XSS)
      secure: process.env.NODE_ENV === 'production', // * Send the cookie only over HTTPS in production
      sameSite: 'strict', // * Prevent the cookie from being sent with cross-site requests (protects against CSRF)
      path: '/api/auth/refresh', // * Send only to the refresh endpoint
      maxAge: ms(refreshExpiresIn), // * Expires after 30 days
    });

    return { member, accessToken };
  }

  // * Set Password (Member)
  @Post('members/set-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  setPasswordMember(
    @Query() rawToken: QueryTokenDto,
    @Body() body: SetPasswordMemberDto,
  ) {
    return this.authService.setPasswordMember(rawToken.token, body);
  }

  // * Forgot password (Member)
  @Post('members/forgot-password')
  @HttpCode(HttpStatus.OK) // * set default status code
  @Throttle({ default: { limit: 3, ttl: 3600_000 } }) // * Set Rate Limiting (3 req / 1h)
  forgotPasswordMember(@Body() body: ForgotPasswordMemberDto) {
    return this.authService.forgotPasswordMember(body.userName);
  }

  // * Password reset (Member)
  @Post('members/reset-password')
  @Throttle({ default: { limit: 5, ttl: 3600_000 } })
  resetPasswordMember(
    @Query() rawToken: QueryTokenDto,
    @Body() body: ResetPasswordMemberDto,
  ) {
    return this.authService.resetPasswordMember(rawToken.token, body.password);
  }
}
