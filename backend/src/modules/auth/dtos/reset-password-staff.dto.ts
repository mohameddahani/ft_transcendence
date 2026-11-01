import { PickType } from '@nestjs/swagger';
import { SetPasswordStaffDto } from './set-password-staff.dto';

export class ResetPasswordStaffDto extends PickType(SetPasswordStaffDto, [
  'password',
] as const) {}
