import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginMemberDto } from './dto/login-member.dto';
import { MemberStatus } from '@/generated/prisma/enums';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class MemberAccountService {
  constructor(private readonly prisma: PrismaService) {}

  // * Login
  async login(data: LoginMemberDto) {
    // * Check if member already exist by userName before login
    const member = await this.prisma.member.findUnique({
      where: { userName: data.userName },
    });
    if (!member) {
      throw new UnauthorizedException('Invalid User Name or Password');
    }

    // * Check status of account
    if (member.status === MemberStatus.BANNED) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact your gym administrator for assistance.',
      );
    }

    if (member.status === MemberStatus.FROZEN) {
      throw new UnauthorizedException(
        'Your account is temporarily inactive. Please contact your gym administrator to reactivate your membership.',
      );
    }

    // * Check the member if he set a password
    if (!member.password) {
      throw new UnauthorizedException(
        'Your account has not been activated yet. Please check your email and set your password to continue.',
      );
    }

    // * Check the password is match
    const passwordIsMatch = await bcrypt.compare(
      data.password,
      member.password,
    );
    if (!passwordIsMatch) {
      throw new UnauthorizedException('Invalid User Name or Password');
    }

    // * Generate JWT
  }
}
