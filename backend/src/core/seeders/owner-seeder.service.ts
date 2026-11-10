import { Gender, Role } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import {
  DEFAULT_AVATARS,
  DEFAULT_AVATARS_ID,
} from '../constants/default-avatars.constants';

@Injectable()

// * After all modules initialize, before accepting requests
export class OwnerSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OwnerSeederService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    // * Get Data
    const data = {
      firstName: this.config.getOrThrow<string>('OWNER_FIRST_NAME'),
      lastName: this.config.getOrThrow<string>('OWNER_LAST_NAME'),
      gender: Gender.MALE,
      birthDate: new Date(this.config.getOrThrow<string>('OWNER_BIRTH_DATE')),
      userName: this.config.getOrThrow<string>('OWNER_USERNAME'),
      email: this.config.getOrThrow<string>('OWNER_EMAIL'),

      // * Hash the password before saving it
      password: await hash(
        this.config.getOrThrow<string>('OWNER_PASSWORD'),
        10,
      ),

      phoneNumber: this.config.getOrThrow<string>('OWNER_PHONE_NUMBER'),
      companyName: this.config.getOrThrow<string>('OWNER_COMPANY_NAME'),

      role: Role.OWNER,
      isAccountVerified: true,
      termsAccepted: true,

      profileImageUrl: DEFAULT_AVATARS.OWNER,
      profileImagePublicId: DEFAULT_AVATARS_ID.OWNER,
    };

    // * Check if user already exist before register
    const existingOwner = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phoneNumber: data.phoneNumber },
          { userName: data.userName },
        ],
      },
    });

    if (existingOwner) {
      if (existingOwner.email === data.email) {
        this.logger.error('Owner Email already exists');
      }

      if (existingOwner.phoneNumber === data.phoneNumber) {
        this.logger.error('Owner Phone number already exists');
      }

      if (existingOwner.userName === data.userName) {
        this.logger.error('Owner User Name already exists');
      }
      return;
    }

    // * Save the owner in the database
    await this.prisma.user.create({
      data,
    });

    this.logger.log('Owner account initialized.');
  }
}
