import { Controller, Post, Headers, Body, HttpCode } from '@nestjs/common';
import { rewardTokenSubService } from './reward-Token-Sub.service.js';

@Controller('blockchain')
export class rewardTokenSubController {
  constructor(private rewardTokenSubService: rewardTokenSubService) {}
  @Post('rewardClient')
  @HttpCode(200)
  rewardTokenSub(
    @Headers('x-reward-secret') secret: string | undefined,
    @Body() body: unknown,
  ) {
    return this.rewardTokenSubService.rewardClient(secret, body);
  }
}
