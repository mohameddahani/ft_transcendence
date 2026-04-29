import { Controller, Get } from "@nestjs/common";

@Controller()
export class ProductsController {
  @Get("/api/products")
  getAllProducts() {
    return [
      { id: 1, title: "book1", price: 10 },
      { id: 2, title: "book2", price: 20 },
      { id: 3, title: "book3", price: 30 },
      { id: 4, title: "boo4", price: 40 },
      { id: 5, title: "book5", price: 50 },
    ];
  }
}
