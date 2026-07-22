import { RefreshTokenPayload } from '@/core/types/jwt-payload.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

const refreshTokenExtractor = (request: Request): string | null => {
  const cookies = request.cookies as Record<string, string | undefined>;

  return cookies.refresh_token ?? null;
};

@Injectable()
export class OwnerRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'owner-refresh-token',
) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([refreshTokenExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_OWNER_REFRESH_SECRET'),
    });
  }

  validate(refreshTokenPayload: RefreshTokenPayload) {
    return refreshTokenPayload;
  }
}
