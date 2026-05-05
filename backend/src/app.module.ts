import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    // * if you want to use a .env file to manage environment variables, use ConfigModule.forRoot()
    // * isGlobal: true → makes ConfigModule available globally across the whole application (no need to import in other modules)
    // * envFilePath: path of .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [],
})
export class AppModule {}
