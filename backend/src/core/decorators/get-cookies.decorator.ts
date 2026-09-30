import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const GetCookies = createParamDecorator(
  (
    data: string | undefined,
    context: ExecutionContext,
  ): string | Record<string, string> | undefined => {
    const request: Request = context.switchToHttp().getRequest();

    const cookies = request.cookies as Record<string, string>;

    return data ? cookies[data] : cookies;
  },
);
