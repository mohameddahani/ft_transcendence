import { Controller, Post, Get, Req, Res } from "@nestjs/common";
import { relayerService } from "./relayer.service.js";
import type { Response, Request } from 'express';

@Controller('blockchain')
export  class relayerController{
    constructor(private relayerService: relayerService){}

    @Post('relayer')
    relayer(@Res() res: Response, @Req() req: Request)
    {
        return this.relayerService.relayer(res, req)
    }
}