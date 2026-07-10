import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthProvider } from './auth.provider';
import { JwtPayload } from '@/core/types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(private readonly authProvider: AuthProvider) {}

  // * Register
  register(data: RegisterUserDto) {
    return this.authProvider.register(data);
  }

  // * Login
  login(data: LoginUserDto) {
    return this.authProvider.login(data);
  }

  // * Activate user account
  activateAccount(userPayload: JwtPayload) {
    return this.authProvider.activateAccount(userPayload);
  }

  // // * Forgot password
  // forgotPassword(email: string) {
  //   return this.authProvider.forgotPassword(email);
  // }

  // // * Reset password
  // resetPassword(token: string, password: string) {
  //   return this.authProvider.resetPassword(token, password);
  // }
}
