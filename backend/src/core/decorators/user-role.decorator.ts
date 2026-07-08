// ! OLD SYNTAX
// import { UserType } from '@/generated/prisma/enums';
// import { SetMetadata } from '@nestjs/common';

// // * Create a Custom Method decorator
// // * ...roles: rest parameter that collects one or more UserType values into an array
// // * SetMetadata('roles', roles): attaches metadata to the route handler with key 'roles' so it can later be read by Reflector inside a Guard (e.g. RolesGuard)
// export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles);

import { UserType } from '@/generated/prisma/enums';
import { Reflector } from '@nestjs/core';

// ! NEW SYNTAX
// * Reflector: is a NestJS utility used to read and write metadata on classes and route handlers.
//   It is mainly used in Guards and Interceptors to access metadata added by decorators.
//
// * createDecorator(): is a helper function that creates a strongly-typed custom decorator
//   which automatically stores and retrieves metadata without using manual string keys (like 'roles').
//
//   It improves type safety and avoids bugs caused by typos in metadata keys.
export const Roles = Reflector.createDecorator<UserType[]>();
