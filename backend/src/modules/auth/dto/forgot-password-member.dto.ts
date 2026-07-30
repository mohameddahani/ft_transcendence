import { PickType } from '@nestjs/mapped-types';
import { LoginMemberDto } from './login-member.dto';

export class ForgotPasswordMemberDto extends PickType(LoginMemberDto, [
  'userName',
] as const) {}
