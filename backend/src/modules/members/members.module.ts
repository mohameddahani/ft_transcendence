import { Module } from '@nestjs/common';
import { AdminMembersController } from './admin-members.controller';
import { MembersService } from './members.service';
import { EmailModule } from '@/infrastructure/email/email.module';
import { StaffMembersController } from './staff-members.controller';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [AdminMembersController, StaffMembersController],
  providers: [MembersService],
  imports: [EmailModule, AccessesModule],
  exports: [],
})
export class MembersModule {}
