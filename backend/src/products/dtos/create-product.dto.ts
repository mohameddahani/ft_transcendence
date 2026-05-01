import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateProductDto {
  @MaxLength(150)
  @MinLength(2)
  @IsNotEmpty()
  @IsString()
  title!: string;

  @Min(0)
  @IsNotEmpty()
  @IsNumber()
  price!: number;
}
