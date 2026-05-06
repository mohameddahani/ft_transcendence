import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private readonly Config: ConfigService) {
    // * Create this adapter to communicate with postgres
    const adapter = new PrismaPg({
      connectionString: Config.get<string>('DATABASE_URL'),
    });
    super({ adapter });
  }
}
