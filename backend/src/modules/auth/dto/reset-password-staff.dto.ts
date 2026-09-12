import { PickType } from '@nestjs/swagger';
import { LoginStaffDto } from './login-staff.dto';

export class ResetPasswordStaffDto extends PickType(LoginStaffDto, [
  'password',
] as const) {}
