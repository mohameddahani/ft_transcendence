import { OmitType, PartialType } from '@nestjs/mapped-types';
import { RegisterUserDto } from '../../auth/dto/register-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(RegisterUserDto, ['termsAccepted'] as const),
) {}
