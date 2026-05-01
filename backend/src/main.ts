import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // * app.useGlobalPipes() is used to apply pipes globally to the entire application.
  // * Pipes can transform input data or validate it before it reaches the route handler.

  // * new ValidationPipe() is a built-in class that automatically validates incoming requests
  // * based on the decorators in your DTOs (like @IsString, @MinLength, etc.).

  // * whitelist is an option that removes any properties from the incoming request object
  // * that are *not* defined in the DTO class. This helps prevent unexpected or malicious data.

  // * forbidNonWhitelisted is an option that makes the app throw an error if the request contains
  // * properties that are not allowed (i.e., not defined in the DTO). Useful for stricter validation.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
