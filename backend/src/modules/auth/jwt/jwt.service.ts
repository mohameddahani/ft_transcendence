import { JwtTokenType } from '@/core/enums/jwt-token-type.enum';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '@/core/types/jwt-payload.type';
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
  generateAccessToken(accessTokenPayload: AccessTokenPayload) {
    // * Get Secret key and expiresIn
    const { secret, expiresIn } = this.jwtProvider.getJwtConfig(
      accessTokenPayload.role,
      JwtTokenType.ACCESS,
    );

    // * Generate The Token
    return this.jwtService.sign(accessTokenPayload, {
      secret,
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    });
  }

  // * Generate Refresh Token
  generateRefreshToken(refreshTokenPayload: RefreshTokenPayload) {
    // * Get Secret key and expiresIn
    const { secret, expiresIn } = this.jwtProvider.getJwtConfig(
      refreshTokenPayload.role,
      JwtTokenType.REFRESH,
    );

    // * Generate The Token
    return this.jwtService.sign(refreshTokenPayload, {
      secret,
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    });
  }

  // * Generate Email Verification Token
  generateEmailVerificationToken(accessTokenPayload: AccessTokenPayload) {
    // * Get Secret key and expiresIn
    const { secret, expiresIn } = this.jwtProvider.getJwtConfig(
      accessTokenPayload.role,
      JwtTokenType.EMAIL_VERIFICATION,
    );

    // * Generate The Token
    return this.jwtService.sign(accessTokenPayload, {
      secret,
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    });
  }

  // * Generate Password Reset Token
  generatePasswordResetToken(accessTokenPayload: AccessTokenPayload) {
    // * Get Secret key and expiresIn
    const { secret, expiresIn } = this.jwtProvider.getJwtConfig(
      accessTokenPayload.role,
      JwtTokenType.PASSWORD_RESET,
    );

    // * Generate The Token
    return this.jwtService.sign(accessTokenPayload, {
      secret,
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    });
  }
}
