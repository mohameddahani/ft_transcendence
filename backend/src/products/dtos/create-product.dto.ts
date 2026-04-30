import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class ProductDto {
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsNumber()
  price!: number;
}
