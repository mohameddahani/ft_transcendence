import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  controllers: [PlansController],
  providers: [PlansService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class PlansModule {}
