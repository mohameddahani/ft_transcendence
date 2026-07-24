import { Module } from '@nestjs/common';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminPaymentsService } from './admin-payments.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [AdminPaymentsController],
  providers: [AdminPaymentsService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class PaymentsModule {}
