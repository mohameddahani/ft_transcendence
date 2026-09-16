import { PickType } from '@nestjs/swagger';
import { LoginMemberDto } from './login-member.dto';

export class ResetPasswordMemberDto extends PickType(LoginMemberDto, [
  'password',
] as const) {}
