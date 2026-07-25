import { IsUUID } from 'class-validator';

export class CancelSubscriptionDto {
  // * AdminId
  @IsUUID()
  adminId!: string;
}
