import { PickType } from '@nestjs/swagger';
import { LoginMemberDto } from './login-member.dto';

export class ForgotPasswordMemberDto extends PickType(LoginMemberDto, [
  'userName',
] as const) {}
