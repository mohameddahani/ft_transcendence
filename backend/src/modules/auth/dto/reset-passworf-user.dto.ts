import { PickType } from '@nestjs/mapped-types';
import { RegisterUserDto } from '../../auth/dto/register-user.dto';

export class ResetPasswordUserDto extends PickType(RegisterUserDto, [
  'password',
] as const) {}
