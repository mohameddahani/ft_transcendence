/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

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
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // * Helmet
  // ? helmet is a security middleware for NestJS / Express.js that automatically adds secure HTTP headers to your server responses.
  // ? middleware is code that runs before your route handler.

  // * cookie-parser
  // ? is a middleware used to extract and parse incoming cookies from the client's request header, converting the raw string into a usable JavaScript object automatically.
  app.use(helmet(), cookieParser());

  // todo: Cors

  // * Swagger
  // ? Swagger is a tool that automatically creates API documentation + testing UI for your backend.

  // * Get domain of server
  const domain = new ConfigService().getOrThrow<string>('FRONTEND_URL');

  // * Config of document
  const swagger = new DocumentBuilder()
    .setTitle('ft_transcendence')
    .setDescription(
      'ft_transcendence — Final 42 Common Core project: a full-stack web app built as a team. From learning basics to building real-world systems, this project represents the end of the journey and the start of professional growth, combining creativity, scalability, and modern technologies.',
    )
    .addServer(domain)
    .setTermsOfService(`${domain}/terms`)
    .setLicense('ft_transcendence License', `${domain}/license`)
    .addSecurity('bearer', { type: 'http', scheme: 'bearer' })
    .addBearerAuth()
    .setVersion('1.0')
    .build();
  const documentation = SwaggerModule.createDocument(app, swagger); // * create document
  SwaggerModule.setup('swagger', app, documentation); // * setup documentation on domain/swagger

  // * CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL, // * Controls which websites are allowed to access your API or to see Response Your API.
    credentials: true, // * Allows cookies and HTTP authentication.
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // * Allowed HTTP methods.
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'], // * Which request headers the browser may send
    maxAge: 86400, // * How long the browser caches the CORS preflight (OPTIONS) response. / 86400 = 24 hours.
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
