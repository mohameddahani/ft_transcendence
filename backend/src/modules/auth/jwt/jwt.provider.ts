import { JwtTokenType } from '@/core/enums/jwt-token-type.enum';
import { Role } from '@/generated/prisma/enums';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtProvider {
  constructor(private readonly config: ConfigService) {}

  // * Get Secret Key and expiresIn fom envirement
  getJwtConfig(role: Role, type: JwtTokenType) {
    if (role === Role.OWNER) {
      if (type === JwtTokenType.ACCESS) {
        return {
          secret: this.config.getOrThrow<string>('JWT_OWNER_ACCESS_SECRET'),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_OWNER_ACCESS_EXPIRES_IN',
          ),
        };
      } else if (type === JwtTokenType.REFRESH) {
        return {
          secret: this.config.getOrThrow<string>('JWT_OWNER_REFRESH_SECRET'),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_OWNER_REFRESH_EXPIRES_IN',
          ),
        };
      } else if (type === JwtTokenType.EMAIL_VERIFICATION) {
        return {
          secret: this.config.getOrThrow<string>(
            'JWT_OWNER_EMAIL_VERIFICATION_SECRET',
          ),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_OWNER_EMAIL_VERIFICATION_EXPIRES_IN',
          ),
        };
      } else if (type === JwtTokenType.PASSWORD_RESET) {
        return {
          secret: this.config.getOrThrow<string>(
            'JWT_OWNER_PASSWORD_RESET_SECRET',
          ),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_OWNER_PASSWORD_RESET_EXPIRES_IN',
          ),
        };
      }
    } else if (role === Role.ADMIN) {
      if (type === JwtTokenType.ACCESS) {
        return {
          secret: this.config.getOrThrow<string>('JWT_ADMIN_ACCESS_SECRET'),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_ADMIN_ACCESS_EXPIRES_IN',
          ),
        };
      } else if (type === JwtTokenType.REFRESH) {
        return {
          secret: this.config.getOrThrow<string>('JWT_ADMIN_REFRESH_SECRET'),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_ADMIN_REFRESH_EXPIRES_IN',
          ),
        };
      } else if (type === JwtTokenType.EMAIL_VERIFICATION) {
        return {
          secret: this.config.getOrThrow<string>(
            'JWT_ADMIN_EMAIL_VERIFICATION_SECRET',
          ),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_ADMIN_EMAIL_VERIFICATION_EXPIRES_IN',
          ),
        };
      } else if (type === JwtTokenType.PASSWORD_RESET) {
        return {
          secret: this.config.getOrThrow<string>(
            'JWT_ADMIN_PASSWORD_RESET_SECRET',
          ),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_ADMIN_PASSWORD_RESET_EXPIRES_IN',
          ),
        };
      }
    } else if (role === Role.MEMBER) {
      if (type === JwtTokenType.ACCESS) {
        return {
          secret: this.config.getOrThrow<string>('JWT_MEMBER_ACCESS_SECRET'),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_MEMBER_ACCESS_EXPIRES_IN',
          ),
        };
      } else if (type === JwtTokenType.REFRESH) {
        return {
          secret: this.config.getOrThrow<string>('JWT_MEMBER_REFRESH_SECRET'),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_MEMBER_REFRESH_EXPIRES_IN',
          ),
        };
      } else if (type === JwtTokenType.EMAIL_VERIFICATION) {
        return {
          secret: this.config.getOrThrow<string>(
            'JWT_MEMBER_EMAIL_VERIFICATION_SECRET',
          ),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_MEMBER_EMAIL_VERIFICATION_EXPIRES_IN',
          ),
        };
      } else if (type === JwtTokenType.PASSWORD_RESET) {
        return {
          secret: this.config.getOrThrow<string>(
            'JWT_MEMBER_PASSWORD_RESET_SECRET',
          ),
          expiresIn: this.config.getOrThrow<string>(
            'JWT_MEMBER_PASSWORD_RESET_EXPIRES_IN',
          ),
        };
      }
    }
    throw new Error('Invalid JWT configuration');
  }
}
