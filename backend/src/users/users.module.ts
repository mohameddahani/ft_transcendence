import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthProvider } from './providers/auth.provider';
import { EmailService } from '@/email/email.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, AuthProvider, EmailService],
  imports: [],
  exports: [],
})
export class UsersModule {}
