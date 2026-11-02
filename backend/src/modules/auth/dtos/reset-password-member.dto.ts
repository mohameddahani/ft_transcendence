import { PickType } from '@nestjs/swagger';
import { SetPasswordMemberDto } from './set-password-member.dto';

export class ResetPasswordMemberDto extends PickType(SetPasswordMemberDto, [
  'password',
] as const) {}
