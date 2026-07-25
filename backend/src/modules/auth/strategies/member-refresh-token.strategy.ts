import { RefreshTokenPayload } from '@/core/types/jwt-payload.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class MemberRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'member-refresh-token',
) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_MEMBER_REFRESH_SECRET'),
    });
  }

  validate(refreshTokenPayload: RefreshTokenPayload) {
    return refreshTokenPayload;
  }
}
