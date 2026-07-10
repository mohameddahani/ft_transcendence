import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { EmailVerificationAuthGuard } from './guards/email-verification-auth.guard';
import type { JwtPayload } from '@/core/types/jwt-payload.type';
import { CurrentUser } from '@/core/decorators/current-user.decorator';

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
  login(@Body() body: LoginUserDto) {
    return this.authService.login(body);
  }

  // * Activate user account
  @Get('email-verification')
  @UseGuards(EmailVerificationAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 3600_000 } })
  activateAccount(@CurrentUser() userPayload: JwtPayload) {
    return this.authService.activateAccount(userPayload);
  }

  // // * Forgot password
  // @Post('forgot-password')
  // @HttpCode(HttpStatus.OK) // * set default status code
  // @Throttle({ default: { limit: 3, ttl: 3600_000 } }) // * Set Rate Limiting (3 req / 1h)
  // forgotPassword(@Body() email: ForgotPasswordUserDto) {
  //   return this.authService.forgotPassword(email.email);
  // }

  // // * Reset password
  // @Post('reset-password')
  // @Throttle({ default: { limit: 5, ttl: 3600_000 } })
  // resetPassword(
  //   @Query('token') token: string,
  //   @Body() password: ResetPasswordUserDto,
  // ) {
  //   return this.authService.resetPassword(token, password.password);
  // }
}
