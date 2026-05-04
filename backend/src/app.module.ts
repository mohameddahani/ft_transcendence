import { Module } from "@nestjs/common";
import { ProductsModule } from "./products/products.module";
import { UsersModule } from "./users/users.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "./products/product.entity";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User } from "./users/register.entity";
import { PrismaService } from "./prisma/prisma.service";

// todo @Entity → define table
// todo forRoot → register table in DB
// todo forFeature → make repository available
// todo @InjectRepository → use repository

@Module({
  imports: [
    ProductsModule,
    UsersModule,
    // * if you want to use a .env file to manage environment variables, use ConfigModule.forRoot()
    // * isGlobal: true → makes ConfigModule available globally across the whole application (no need to import in other modules)
    // * envFilePath: path of .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    // * connect to database using typeORM and get values from .env file using ConfigService
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: config.get<string>("DB_TYPE") as "postgres",
          username: config.get<string>("DB_USERNAME"),
          password: config.get<string>("DB_PASSWORD"),
          port: config.get<number>("DB_PORT"),
          host: config.get<string>("DB_HOST"),
          database: config.get<string>("DB_DATABASE_NAME"),
          synchronize: config.get<string>("NODE_ENV") === "development", // ! only for development mode (this condition will be true if i use env of development)
          entities: [Product, User],
        };
      },
    }),
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
