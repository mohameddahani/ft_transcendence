import { Module } from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';
import { MemberFeedbacksController } from './member-feedbacks.controller';
import { AccessesService } from '@/core/services/access.service';
import { AuthModule } from '../auth/auth.module';
import { AdminFeedbacksController } from './admin-feedbacks.controller';
import { StaffFeedbacksController } from './staff-feedbacks.controller';

@Module({
  controllers: [
    MemberFeedbacksController,
    AdminFeedbacksController,
    StaffFeedbacksController,
  ],
  providers: [AccessesService, FeedbacksService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class FeedbacksModule {}
