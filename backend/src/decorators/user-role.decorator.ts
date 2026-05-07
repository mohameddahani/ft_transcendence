import { UserType } from '@/generated/prisma/enums';
import { SetMetadata } from '@nestjs/common';

// * Create a Custom Method decorator
// * ...roles: rest parameter that collects one or more UserType values into an array
// * SetMetadata('roles', roles): attaches metadata to the route handler with key 'roles' so it can later be read by Reflector inside a Guard (e.g. RolesGuard)
export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles);
