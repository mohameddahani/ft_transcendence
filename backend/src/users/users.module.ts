import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthProvider } from './providers/auth.provider';
import { EmailModule } from '@/email/email.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService, AuthProvider],
  imports: [EmailModule],
  exports: [],
})
export class UsersModule {}
