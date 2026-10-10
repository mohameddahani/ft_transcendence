import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import "dotenv/config"

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000' , 'http://localhost:3001'],
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
