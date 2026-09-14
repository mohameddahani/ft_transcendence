import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StaffsController } from './staffs.controller';
import { StaffsService } from './staffs.service';
import { EmailModule } from '@/infrastructure/email/email.module';
import { AccessesService } from '@/core/services/access.service';

@Module({
  controllers: [StaffsController],
  providers: [StaffsService, AccessesService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    EmailModule,
  ],
  exports: [],
})
export class StaffsModule {}
