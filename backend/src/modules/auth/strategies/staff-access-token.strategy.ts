import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class StaffAccessTokenStrategy extends PassportStrategy(
  Strategy,
  'staff-access-token',
) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_STAFF_ACCESS_SECRET'),
    });
  }

  validate(accessTokenPayload: AccessTokenPayload) {
    return accessTokenPayload;
  }
}
