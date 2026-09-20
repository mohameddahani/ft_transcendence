import { AccessesService } from '@/core/services/access.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkingHoursController } from './working-hours.controller';
import { WorkingHoursService } from './working-hours.service';

@Module({
  controllers: [
    WorkingHoursController,

    // SpecialHoursController
  ],
  providers: [AccessesService, WorkingHoursService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class WorkingHoursModule {}
