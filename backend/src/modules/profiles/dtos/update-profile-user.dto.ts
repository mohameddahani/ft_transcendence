import { OmitType, PartialType } from '@nestjs/swagger';
import { RegisterUserDto } from '../../auth/dtos/register-user.dto';

export class UpdateProfileUserDto extends PartialType(
  OmitType(RegisterUserDto, ['termsAccepted'] as const),
) {}
