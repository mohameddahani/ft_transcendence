import { Module } from '@nestjs/common';
import { relayerModule } from './relayer/relayer.module.js';

@Module({
  imports: [relayerModule],
})
export class AppModule {}
