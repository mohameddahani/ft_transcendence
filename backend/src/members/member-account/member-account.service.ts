import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { LoginMemberDto } from './dto/login-member.dto';

@Injectable()
export class MemberAccountService {
  constructor(private readonly prisma: PrismaService) {}

  // * Login
  async login(data: LoginMemberDto) {}
}
