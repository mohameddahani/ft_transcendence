import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthProvider } from './auth.provider';
import { PassportModule } from '@nestjs/passport';
import { EmailModule } from '@/infrastructure/email/email.module';
import { CustomJwtService } from './jwt.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthProvider, CustomJwtService],
  imports: [PassportModule, EmailModule],
  exports: [],
})
export class AuthModule {}
