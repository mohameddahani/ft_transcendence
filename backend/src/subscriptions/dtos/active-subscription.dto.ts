import { Transform } from 'class-transformer';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ActiveSubscriptionDto {
  // * PlanId
  @IsUUID()
  planId!: string;

  // * DurationId
  @IsUUID()
  planDurationId!: string;

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
