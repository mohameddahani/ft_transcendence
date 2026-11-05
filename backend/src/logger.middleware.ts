import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    this.logger.log(`[+] Incoming Request: ${method} ${originalUrl} - IP: ${ip} [${userAgent}]`);

    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.log(`[+] Outgoing Response: ${method} ${originalUrl} - Status: ${statusCode}`);
    });

    next();
  }
}
