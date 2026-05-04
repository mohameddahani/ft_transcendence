import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateProductDto } from "./dtos/create-product.dto";
import { UpdateProductDto } from "./dtos/update-product.dto";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "./product.entity";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async getAll(): Promise<Product[]> {
    const products = await this.productsRepository.find();
    if (products.length <= 0) {
      throw new NotFoundException("no products to show");
    }
    return products;
  }

  async getOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException("product not found");
    }
    return product;
  }

  async createProduct(data: CreateProductDto): Promise<Product> {
    const newProduct: Product = this.productsRepository.create(data);
    return await this.productsRepository.save(newProduct);
  }

  async updateOne(id: number, data: UpdateProductDto): Promise<Product> {
    const updateProduct = await this.productsRepository.findOne({
      where: { id },
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
    await this.productsRepository.save(updateProduct);
    return updateProduct;
  }

  async deleteOne(id: number) {
    const deleteProduct = await this.productsRepository.findOne({
      where: { id },
    });
    if (!deleteProduct) {
      throw new NotFoundException("product not found");
    }
    await this.productsRepository.delete(id);

    // ! Delete all Products
    // await this.productsRepository.query(
    //   `TRUNCATE TABLE products RESTART IDENTITY CASCADE`,
    // );
  }
}
