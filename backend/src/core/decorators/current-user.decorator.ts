import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JWTPayload } from '@/utils/types';

// * Create a Custom Parameter decorator
// * data is optional metadata passed when using the decorator (e.g. @CurrentUser('id'))
// * context is the ExecutionContext that gives access to the current request, response, and handler execution details
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): JWTPayload => {
    const request: Request = context.switchToHttp().getRequest();
    return request['user'] as JWTPayload;
  },
);
