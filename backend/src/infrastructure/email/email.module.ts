import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ResendProvider } from './email.provider';

@Module({
  providers: [EmailService, ResendProvider],
  exports: [EmailService],
})
export class EmailModule {}
