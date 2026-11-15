import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>(
        'REWARDS_DATABASE_URL',
      ),
      max: 5,
      connectionTimeoutMillis: 5000,
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    // Check that DevOps applied the backend migration and role grants.
    await this.membershipReward.findFirst();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
