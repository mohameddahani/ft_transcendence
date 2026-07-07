import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MembershipPlanModule } from './membership-plans/membership-plans.module';
import { MembersModule } from './members/members.module';
import { PlansModule } from './owners/plans/plans.module';
import { SubscriptionsModule } from './owners/subscriptions/subscriptions.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionCron } from './cron/subscription.cron';
import { MembershipCron } from './cron/membership.cron';
import { PaymentCron } from './cron/payment.cron';
import { PaymentsModule } from './payments/payments.module';
import { MembershipsModule } from './memberships/memberships.module';
import { OwnersModule } from './owners/owners.module';
import { MemberAccount } from './members/member-account/member-account.module';

@Module({
  imports: [
    // * if you want to use a .env file to manage environment variables, use ConfigModule.forRoot()
    // * isGlobal: true → makes ConfigModule available globally across the whole application (no need to import in other modules)
    // * envFilePath: path of .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // * Config the JWT
    // * Use registerAsync to get dynamic data from .env
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<StringValue>('JWT_EXPIRES_IN'),
        },
      }),
    }),

    // * Rate Limiting
    ThrottlerModule.forRoot([
      // * Config
      {
        ttl: 60_000,
        limit: 100, // global default (public routes)
      },
    ]),

    // * Task scheduling (Cron)
    ScheduleModule.forRoot(),

    UsersModule,
    OwnersModule,
    // * import prisma module to access prisma from any where in our app
    PrismaModule,
    MembershipPlanModule,
    MembersModule,
    PlansModule,
    SubscriptionsModule,
    PaymentsModule,
    MembershipsModule,
    MemberAccount,
  ],

  providers: [
    // * Provider of Rate Limiting
    // * Applied globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // * Cron
    SubscriptionCron,
    MembershipCron,
    PaymentCron,
  ],
})
export class AppModule {}
