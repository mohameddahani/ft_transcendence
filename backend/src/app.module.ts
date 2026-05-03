import { Module } from "@nestjs/common";
import { ProductsModule } from "./products/products.module";
import { UsersModule } from "./users/users.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "./products/product.entity";

// todo @Entity → define table
// todo forRoot → register table in DB
// todo forFeature → make repository available
// todo @InjectRepository → use repository

@Module({
  imports: [
    ProductsModule,
    UsersModule,
    TypeOrmModule.forRoot({
      type: "postgres",
      username: "admin",
      password: "1234",
      port: 5432,
      host: "localhost",
      database: "ft_transcendence",
      synchronize: true, // ! Only for development
      entities: [Product],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
