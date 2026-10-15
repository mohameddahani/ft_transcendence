import { Controller, Post, Res, Req } from "@nestjs/common";
import  {rewardTokenSubService} from "./reward-Token-Sub.service.js"
import type { Response, Request } from 'express';

@Controller('blockchain')
export class rewardTokenSubController{
    constructor(private rewardTokenSubService: rewardTokenSubService){}
    @Post('rewardClient')
    rewardTokenSub(@Res() res: Response, @Req() req: Request){
        return this.rewardTokenSubService.rewardClient(res, req);
    }
}