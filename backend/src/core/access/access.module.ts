import { Module } from '@nestjs/common';
import { AccessesService } from './access.service';

@Module({
  providers: [AccessesService],
  exports: [AccessesService],
})
export class AccessesModule {}
