import { Module } from '@nestjs/common';
import { OwnersController } from './owners.controller';
import { OwnersService } from './owners.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [OwnersController],
  providers: [OwnersService],
  imports: [
    AuthModule, // * This for documentation because auth module has all passport strategies and this module use it.
  ],
  exports: [],
})
export class OwnersModule {}
