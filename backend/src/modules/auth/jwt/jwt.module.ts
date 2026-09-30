import { Module } from '@nestjs/common';
import { JwtProvider } from './jwt.provider';
import { CustomJwtService } from './jwt.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  providers: [CustomJwtService, JwtProvider],
  exports: [CustomJwtService],
})
export class CustomJwtModule {}
