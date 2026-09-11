import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StaffsController } from './staffs.controller';
import { StaffsService } from './staffs.service';

@Module({
  controllers: [StaffsController],
  providers: [StaffsService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class StaffsModule {}
