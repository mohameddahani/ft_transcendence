import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // ? makes the module providers available globally in the app, but the module still needs to be imported once in AppModule to activate it.
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
