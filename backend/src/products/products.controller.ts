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
import { ProductService } from "./product.service";
import type { Product } from "./product.service";

@Controller("api/products")
export class ProductsController {
  // ! Bad practice
  private productService: ProductService = new ProductService();

  @Get()
  getAllProducts(): CreateProductDto[] {
    return this.productService.getAll();
  }

  @Get(":id")
  getSingleProduct(@Param("id", ParseIntPipe) id: number): Product {
    return this.productService.getOne(id);
  }

  @Post()
  createNewProduct(
    @Body()
    body: CreateProductDto,
  ): Product {
    return this.productService.createProduct(body);
  }

  @Put(":id")
  updateProduct(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ): UpdateProductDto {
    return this.productService.updateOne(id, body);
  }

  @Delete(":id")
  deleteProduct(@Param("id", ParseIntPipe) id: number) {
    this.productService.deleteOne(id);
  }
}
