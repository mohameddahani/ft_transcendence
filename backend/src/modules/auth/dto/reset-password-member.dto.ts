import { PickType } from '@nestjs/mapped-types';
import { LoginMemberDto } from './login-member.dto';

export class ResetPasswordMemberDto extends PickType(LoginMemberDto, [
  'password',
] as const) {}
