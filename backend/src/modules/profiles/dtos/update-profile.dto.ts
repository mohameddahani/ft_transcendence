import { OmitType, PartialType } from '@nestjs/swagger';
import { RegisterUserDto } from '../../auth/dto/register-user.dto';

export class UpdateProfileDto extends PartialType(
  OmitType(RegisterUserDto, ['termsAccepted'] as const),
) {}
