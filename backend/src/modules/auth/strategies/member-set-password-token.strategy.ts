import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class MemberSetPasswordTokenStrategy extends PassportStrategy(
  Strategy,
  'member-set-password-token',
) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter('token'),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_MEMBER_SET_PASSWORD_SECRET'),
    });
  }

  validate(accessTokenPayload: AccessTokenPayload) {
    return accessTokenPayload;
  }
}
