import {
  BadRequestException,
  // Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateProductDto } from "./dtos/create-product.dto";
import { UpdateProductDto } from "./dtos/update-product.dto";

export interface Product {
  id: number;
  title: string;
  price: number;
}

// @Injectable()
export class ProductsService {
  private data: Product[] = [
    { id: 1, title: "book1", price: 10 },
    { id: 2, title: "book2", price: 20 },
    { id: 3, title: "book3", price: 30 },
    { id: 4, title: "book4", price: 40 },
    { id: 5, title: "book5", price: 50 },
  ];

  getAll(): CreateProductDto[] {
    if (this.data.length <= 0) {
      throw new NotFoundException("no product to show");
    }
    return this.data;
  }

  getOne(id: number): Product {
    const product = this.data.find((p: Product) => {
      return p.id === id;
    });
    if (!product) {
      throw new NotFoundException("product not found");
    }
    return product;
  }

  createProduct(data: CreateProductDto): Product {
    const newProduct: Product = {
      id: this.data.length + 1,
      title: data.title,
      price: data.price,
    };
    this.data.push(newProduct);
    return newProduct;
  }

  updateOne(id: number, data: UpdateProductDto): UpdateProductDto {
    const updateProduct = this.data.find((p: Product) => {
      return p.id === id;
    });
    if (!updateProduct) {
      throw new NotFoundException("product not found");
    }
    if (!data) {
      throw new BadRequestException("body is required");
    }
    if (data.title !== undefined) {
      updateProduct.title = data.title;
    }
    if (data.price !== undefined) {
      if (typeof data.price === "string") {
        updateProduct.price = parseInt(data.price);
      } else {
        updateProduct.price = data.price;
      }
    }
    return updateProduct;
  }

  deleteOne(id: number) {
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
