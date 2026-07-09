import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({ usernameField: 'email' });
  }

  validate(email: string, password: string) {
    throw new Error('Method not implemented.');
  }
}
