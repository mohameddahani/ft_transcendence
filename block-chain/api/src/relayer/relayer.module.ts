import { Module } from '@nestjs/common';
import { relayerController } from './relayer.controller.js';
import { relayerService } from './relayer.service.js';

@Module({
    controllers: [relayerController],
    providers: [relayerService]
})
export class relayerModule {}
