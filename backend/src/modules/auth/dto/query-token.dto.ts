import { IsNotEmpty, IsString } from 'class-validator';

export class QueryTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
