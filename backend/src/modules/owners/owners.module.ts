import { Module } from '@nestjs/common';
import { OwnersController } from './owners.controller';
import { OwnersService } from './owners.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [OwnersController],
  providers: [OwnersService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class OwnersModule {}
