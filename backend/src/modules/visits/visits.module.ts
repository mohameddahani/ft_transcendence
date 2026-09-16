import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccessesService } from '@/core/services/access.service';
import { MemberVisitsController } from './member-visits.controller';
import { VisitsService } from './visits.service';

@Module({
  controllers: [MemberVisitsController],
  providers: [AccessesService, VisitsService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class VisitsModule {}
