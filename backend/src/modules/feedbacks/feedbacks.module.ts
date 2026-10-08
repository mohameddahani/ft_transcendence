import { Module } from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';
import { MemberFeedbacksController } from './member-feedbacks.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminFeedbacksController } from './admin-feedbacks.controller';
import { StaffFeedbacksController } from './staff-feedbacks.controller';
import { ExternalApiModule } from '@/infrastructure/external-api/external-api.module';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [
    MemberFeedbacksController,
    AdminFeedbacksController,
    StaffFeedbacksController,
  ],
  providers: [FeedbacksService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    AccessesModule,
    ExternalApiModule,
  ],
  exports: [],
})
export class FeedbacksModule {}
