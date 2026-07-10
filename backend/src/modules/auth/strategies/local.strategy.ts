import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

// * Passport: is an authentication middleware for Node.js that delegates
// * authentication to different strategies (Local, JWT, OAuth, Google, etc.).

// * Strategy: is the Passport Local Strategy responsible for authenticating
// * users using credentials (username/email and password) from the request body.

// * PassportStrategy(): is a function that wraps a Passport strategy,
// * registers it as a NestJS provider with dependency injection support,
// * and returns a class that can be extended.

// * super(): calls the parent Strategy constructor to configure how
// * the Local Strategy extracts authentication credentials.

// * usernameField: specifies which request field Passport should use
// * as the username. By default it is "username", but here it is changed
// * to "email".

// * validate(): is automatically called after Passport extracts the
// * authentication credentials from the request. It should validate
// * the credentials and return the authenticated user. The returned
// * value is attached to request.user.
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({ usernameField: 'email' });
  }

  validate(email: string, password: string) {
    throw new Error('Method not implemented.');
  }
}
