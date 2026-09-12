import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '@/infrastructure/email/email.module';
import { CustomJwtModule } from '../auth/jwt/jwt.module';
import { SubscriptionsModule } from '../platform/subscriptions/subscriptions.module';

@Module({
  controllers: [MembersController],
  providers: [MembersService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    EmailModule,
    CustomJwtModule,
    SubscriptionsModule,
  ],
  exports: [],
})
export class MembersModule {}
