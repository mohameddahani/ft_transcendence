import { Module } from '@nestjs/common';
import { AdminMembersController } from './admin-members.controller';
import { MembersService } from './members.service';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '@/infrastructure/email/email.module';
import { CustomJwtModule } from '../auth/jwt/jwt.module';
import { StaffMembersController } from './staff-members.controller';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [AdminMembersController, StaffMembersController],
  providers: [MembersService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    EmailModule,
    CustomJwtModule,
    AccessesModule,
  ],
  exports: [],
})
export class MembersModule {}
