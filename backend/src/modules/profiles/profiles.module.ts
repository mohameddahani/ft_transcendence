import { Module } from '@nestjs/common';
import { AdminProfilesController } from './admin-profiles.controller';
import { ProfilesService } from './profiles.service';
import { AuthModule } from '../auth/auth.module';
import { OwnerProfilesController } from './owner-profiles.controller';
import { MemberProfilesController } from './member-profiles.controller';
import { CloudinaryModule } from '@/infrastructure/cloudinary/cloudinary.module';
import { StaffProfilesController } from './staff-profiles.controller';

@Module({
  controllers: [
    AdminProfilesController,
    OwnerProfilesController,
    MemberProfilesController,
    StaffProfilesController,
  ],
  providers: [ProfilesService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    CloudinaryModule, // * Import to upload files to Cloudinary
  ],
  exports: [],
})
export class ProfilesModule {}
