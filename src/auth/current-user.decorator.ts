import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { user } from 'src/prisma/generated-client.js';

export const CurrentUser = createParamDecorator(
  (property: keyof user | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const currentUser = request.user;

    return property ? currentUser?.[property] : currentUser;
  },
);
