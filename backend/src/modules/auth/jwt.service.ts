import { UserType } from '@/generated/prisma/enums';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class CustomJwtService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // * Generate Access Token
  generateAccessToken(payload: any) {
    // * Get Secret key and expiresIn
    const { secret, expiresIn } = this.getSecret('ADMIN');

    // * Generate The Token
    return this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    });
  }

  // ! Private
  // * Get Secret Key and expiresIn fom envirement
  private getSecret(role: UserType) {
    switch (role) {
      case UserType.OWNER:
        return {
          secret: this.config.getOrThrow<string>('JWT_OWNER_ACCESS_SECRET'),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_OWNER_ACCESS_EXPIRES_IN',
          ),
        };

      case UserType.ADMIN:
        return {
          secret: this.config.getOrThrow<string>('JWT_ADMIN_ACCESS_SECRET'),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_ADMIN_ACCESS_EXPIRES_IN',
          ),
        };

      case UserType.USER:
        return {
          secret: this.config.getOrThrow<string>('JWT_MEMBER_ACCESS_SECRET'),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_MEMBER_ACCESS_EXPIRES_IN',
          ),
        };

      default:
        throw new UnauthorizedException('Invalid role');
    }
  }
}
