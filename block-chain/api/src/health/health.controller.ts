import { Controller, Get, Res } from '@nestjs/common';
import { MESSAGES } from '@nestjs/core/constants.js';
import { STATUS_CODES } from 'http';

@Controller('health')
export class HealthController {
    @Get()
    health(){
        return "OK";
    }
}
