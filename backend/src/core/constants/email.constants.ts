// * Symbol creates a unique JavaScript value.
// * We use it as a NestJS custom DI token to identify the EmailSender provider.
//
// * A normal string is not unique:
// * 'EMAIL_SENDER' === 'EMAIL_SENDER' // true
//
// * Symbols are unique even with the same description:
// * Symbol('EMAIL_SENDER') === Symbol('EMAIL_SENDER') // false
//
// * Because of this, Symbol helps avoid accidental DI token collisions
// * when different providers use the same token name.

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
