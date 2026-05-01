import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from "@nestjs/common";
import { CreateProductDto } from "./dtos/create-product.dto";
import { UpdateProductDto } from "./dtos/update-product.dto";

interface Product {
  id: number;
  title: string;
  price: number;
}

@Controller("api/products")
export class ProductsController {
  private data: Product[] = [
    { id: 1, title: "book1", price: 10 },
    { id: 2, title: "book2", price: 20 },
    { id: 3, title: "book3", price: 30 },
    { id: 4, title: "book4", price: 40 },
    { id: 5, title: "book5", price: 50 },
  ];

  @Get()
  getAllProducts(): CreateProductDto[] {
    if (this.data.length <= 0) {
      throw new NotFoundException("no product to show");
    }
    return this.data;
  }

  @Get(":id")
  getSingleProduct(@Param("id", ParseIntPipe) id: number): Product {
    const product = this.data.find((p: Product) => {
      return p.id === id;
    });
    if (!product) {
      throw new NotFoundException("product not found");
    }
    return product;
  }

  @Post()
  createNewProduct(
    @Body()
    body: CreateProductDto,
  ): Product {
    const newProduct: Product = {
      id: this.data.length + 1,
      title: body.title,
      price: body.price,
    };
    this.data.push(newProduct);
    return newProduct;
  }

  @Put(":id")
  updateProduct(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ): UpdateProductDto {
    const updateProduct = this.data.find((p: Product) => {
      return p.id === id;
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
  deleteProduct(@Param("id", ParseIntPipe) id: number) {
    const deleteProduct = this.data.find((p: Product) => {
      return p.id === id;
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
