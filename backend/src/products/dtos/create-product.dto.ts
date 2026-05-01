import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";

export class CreateProductDto {
  @IsOptional()
  @IsPositive()
  @IsNotEmpty()
  @IsInt()
  id!: number;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsPositive()
  @IsNotEmpty()
  @IsNumber()
  price!: number;
}
