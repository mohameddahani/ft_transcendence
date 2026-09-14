import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '@/infrastructure/email/email.module';
import { CustomJwtModule } from '../auth/jwt/jwt.module';
import { AccessesService } from '@/core/services/access.service';

@Module({
  controllers: [MembersController],
  providers: [MembersService, AccessesService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    EmailModule,
    CustomJwtModule,
  ],
  exports: [MembersService],
})
export class MembersModule {}
