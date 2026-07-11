import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { EmailVerificationAuthGuard } from './guards/email-verification-auth.guard';
import type { JwtPayload } from '@/core/types/jwt-payload.type';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ForgotPasswordUserDto } from './dto/forgot-passworf-user.dto';
import { ResetPasswordUserDto } from './dto/reset-passworf-user.dto';
import { PasswordResetAuthGuard } from './guards/password-reset-auth.guard';
import type { Request, Response } from 'express';
import { GetCookies } from '@/core/decorators/get-cookies.decorator';
import ms from 'ms';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    const { user, accessToken, refreshTokenHash, refreshExpiresIn } =
      await this.authService.login(request, body);

    // * Store the refresh token in a secure HttpOnly cookie
    response.cookie('refresh_token', refreshTokenHash, {
      httpOnly: true, // * Prevent JavaScript from accessing the cookie (protects against XSS)
      secure: process.env.NODE_ENV === 'production', // * Send the cookie only over HTTPS in production
      sameSite: 'strict', // * Prevent the cookie from being sent with cross-site requests (protects against CSRF)
      path: '/api/auth/refresh', // * Send only to the refresh endpoint
      maxAge: ms(refreshExpiresIn), // * Expires after 30 days
    });

    return { user, accessToken };
  }

  // * Refresh
  @Post('refresh')
  @HttpCode(HttpStatus.OK) // * set default status code
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  refresh(@GetCookies('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  // * Activate user account
  @Get('email-verification')
  @UseGuards(EmailVerificationAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 3600_000 } })
  activateAccount(@CurrentUser() userPayload: JwtPayload) {
    return this.authService.activateAccount(userPayload);
  }

  // * Forgot password
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK) // * set default status code
  @Throttle({ default: { limit: 3, ttl: 3600_000 } }) // * Set Rate Limiting (3 req / 1h)
  forgotPassword(@Body() email: ForgotPasswordUserDto) {
    return this.authService.forgotPassword(email.email);
  }

  // * Password reset
  @Post('password-reset')
  @Throttle({ default: { limit: 5, ttl: 3600_000 } })
  @UseGuards(PasswordResetAuthGuard)
  resetPassword(
    @Body() password: ResetPasswordUserDto,
    @CurrentUser() userPayload: JwtPayload,
  ) {
    return this.authService.passwordReset(userPayload, password.password);
  }
}
