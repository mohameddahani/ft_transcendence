import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthProvider } from './providers/auth.provider';

@Module({
  controllers: [UsersController],
  providers: [UsersService, AuthProvider],
  imports: [],
  exports: [],
})
export class UsersModule {}
