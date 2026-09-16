import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { AccessesService } from '@/core/services/access.service';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Create A Visit
  async createVisit(memberId: string) {
    // * Check if member
  }
}
