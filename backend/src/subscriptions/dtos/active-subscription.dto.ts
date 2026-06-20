import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ActiveSubscriptionDto {
  // * Username
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  userName!: string;

  // * Plan
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  plan!: string;
}
