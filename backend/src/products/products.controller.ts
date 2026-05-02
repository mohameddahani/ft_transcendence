import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from "@nestjs/common";
import { CreateProductDto } from "./dtos/create-product.dto";
import { UpdateProductDto } from "./dtos/update-product.dto";
import { ProductsService } from "./products.service";
import type { Product } from "./products.service";

@Controller("api/products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getAllProducts(): CreateProductDto[] {
    return this.productsService.getAll();
  }

  @Get(":id")
  getSingleProduct(@Param("id", ParseIntPipe) id: number): Product {
    return this.productsService.getOne(id);
  }

  @Post()
  createNewProduct(
    @Body()
    body: CreateProductDto,
  ): Product {
    return this.productsService.createProduct(body);
  }

  @Put(":id")
  updateProduct(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ): UpdateProductDto {
    return this.productsService.updateOne(id, body);
  }

  @Delete(":id")
  deleteProduct(@Param("id", ParseIntPipe) id: number) {
    this.productsService.deleteOne(id);
  }
}
