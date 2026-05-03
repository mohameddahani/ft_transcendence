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
import { Product } from "./product.entity";

@Controller("api/products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getAllProducts() {
    return this.productsService.getAll();
  }

  @Get(":id")
  getSingleProduct(@Param("id", ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.getOne(id);
  }

  @Post()
  createNewProduct(
    @Body()
    body: CreateProductDto,
  ): Promise<Product> {
    return this.productsService.createProduct(body);
  }

  @Put(":id")
  async updateProduct(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ): Promise<Product> {
    return await this.productsService.updateOne(id, body);
  }

  @Delete(":id")
  async deleteProduct(@Param("id", ParseIntPipe) id: number) {
    await this.productsService.deleteOne(id);
  }
}
