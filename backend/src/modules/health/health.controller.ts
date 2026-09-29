import { Controller, Get, Header } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('/api/health')
export class HealthController {
  constructor() {}

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Header('Cache-Control', 'no-store') // * don't save this response in cache
  check() {
    return { status: 'ok' };
  }
}
