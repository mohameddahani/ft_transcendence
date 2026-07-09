import { PickType } from '@nestjs/mapped-types';
import { RegisterUserDto } from '../../auth/dto/register-user.dto';

export class ForgotPasswordUserDto extends PickType(RegisterUserDto, [
  'email',
] as const) {}
