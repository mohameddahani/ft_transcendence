import { PickType } from '@nestjs/swagger';
import { LoginStaffDto } from './login-staff.dto';

export class ForgotPasswordStaffDto extends PickType(LoginStaffDto, [
  'userName',
] as const) {}
