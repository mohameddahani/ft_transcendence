import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import type { CreateProductDto } from "./dtos/create-product.dto";
import type { UpdateProductDto } from "./dtos/update-product.dto";

@Controller("api/products")
export class ProductsController {
  private data: CreateProductDto[] = [
    { id: 1, title: "book1", price: 10 },
    { id: 2, title: "book2", price: 20 },
    { id: 3, title: "book3", price: 30 },
    { id: 4, title: "book4", price: 40 },
    { id: 5, title: "book5", price: 50 },
  ];

  @Get()
  getAllProducts(): CreateProductDto[] {
    return this.data;
  }

  @Get(":id")
  getSingleProduct(@Param("id") id: string): CreateProductDto | string {
    const product = this.data.find((p: CreateProductDto) => {
      return p.id === parseInt(id);
    });
    if (!product) {
      throw new NotFoundException("product not found");
    }
    return product;
  }

  @Post()
  createNewProduct(@Body() body: CreateProductDto): CreateProductDto {
    const newProduct: CreateProductDto = {
      id: this.data.length + 1,
      title: body.title,
      price: body.price,
    };
    this.data.push(newProduct);
    return newProduct;
  }

  @Put(":id")
  updateProduct(
    @Param("id") id: string,
    @Body() body: UpdateProductDto,
  ): UpdateProductDto {
    const updateProduct = this.data.find((p: CreateProductDto) => {
      return p.id === parseInt(id);
    });
    if (!updateProduct) {
      throw new NotFoundException("product not found");
    }
    if (!body) {
      throw new BadRequestException("body is required");
    }
    if (body.title !== undefined) {
      updateProduct.title = body.title;
      console.log("dkhal");
    }
    if (body.price !== undefined) {
      if (typeof body.price === "string") {
        updateProduct.price = parseInt(body.price);
      } else {
        updateProduct.price = body.price;
      }
    }
    return updateProduct;
  }

  @Delete(":id")
  deleteProduct(@Param("id") id: string) {
    const deleteProduct = this.data.find((p: CreateProductDto) => {
      return p.id === parseInt(id);
    });
    if (!deleteProduct) {
      throw new NotFoundException("product not found");
    }
    this.data.splice(this.data.indexOf(deleteProduct), 1);
    return {
      message: "delete product succesfully",
    };
  }
}
