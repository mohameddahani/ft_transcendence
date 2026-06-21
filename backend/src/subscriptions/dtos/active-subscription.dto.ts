import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ActiveSubscriptionDto {
  // * PlanId
  @IsString()
  planId!: string;

  // * DurationId
  @IsString()
  durationId!: string;

  // * Username
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  // trim spaces from start and end
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  userName!: string;
}
