import { Module } from '@nestjs/common';
import { StaffsController } from './staffs.controller';
import { StaffsService } from './staffs.service';
import { EmailModule } from '@/infrastructure/email/email.module';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [StaffsController],
  providers: [StaffsService],
  imports: [EmailModule, AccessesModule],
  exports: [],
})
export class StaffsModule {}
