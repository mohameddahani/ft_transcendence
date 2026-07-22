import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    AuthModule, // * This for documentation because auth module has all passport strategies and this module use it.
  ],
  exports: [],
})
export class UsersModule {}
