import { JwtTokenType } from '@/core/enums/jwt-token-type.enum';
import { JwtPayload } from '@/core/types/jwt-payload.type';
import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { JwtProvider } from './jwt.provider';

@Injectable()
export class CustomJwtService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtProvider: JwtProvider,
  ) {}

  // * Generate Access Token
  generateAccessToken(payload: JwtPayload) {
    // * Get Secret key and expiresIn
    const { secret, expiresIn } = this.jwtProvider.getJwtConfig(
      payload.userType,
      JwtTokenType.ACCESS,
    );

    // * Generate The Token
    return this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    });
  }

  // * Generate Refresh Token
  generateRefreshToken(payload: JwtPayload) {
    // * Get Secret key and expiresIn
    const { secret, expiresIn } = this.jwtProvider.getJwtConfig(
      payload.userType,
      JwtTokenType.REFRESH,
    );

    // * Generate The Token
    return this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    });
  }

  // * Generate Email Verification Token
  generateEmailVerificationToken(payload: JwtPayload) {
    // * Get Secret key and expiresIn
    const { secret, expiresIn } = this.jwtProvider.getJwtConfig(
      payload.userType,
      JwtTokenType.EMAIL_VERIFICATION,
    );

    // * Generate The Token
    return this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    });
  }

  // * Generate Password Reset Token
  generatePasswordResetToken(payload: JwtPayload) {
    // * Get Secret key and expiresIn
    const { secret, expiresIn } = this.jwtProvider.getJwtConfig(
      payload.userType,
      JwtTokenType.PASSWORD_RESET,
    );

    // * Generate The Token
    return this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    });
  }
}
