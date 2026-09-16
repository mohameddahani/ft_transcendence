import { PickType } from '@nestjs/swagger';
import { RegisterUserDto } from '../../auth/dtos/register-user.dto';

export class ResetPasswordUserDto extends PickType(RegisterUserDto, [
  'password',
] as const) {}
