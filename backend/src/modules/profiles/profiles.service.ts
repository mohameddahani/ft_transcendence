import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { DEFAULT_PROFILE_IMAGE } from './constants/users.constants';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { Role } from '@/generated/prisma/enums';
import { Response } from 'express';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  // * Get current user
  async findMe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        firstName: true,
        lastName: true,
        gender: true,
        birthDate: true,
        userName: true,
        email: true,
        phoneNumber: true,
        companyName: true,
        role: true,
        profileImage: true,
        isAccountVerified: true,
        accountStatus: true,
        termsAccepted: true,
        subscription: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    return user;
  }

  // * Update data of user
  async update(id: string, data: UpdateProfileDto) {
    // * Check if user update the username: (we need to check if username is unique)
    const existingData = await this.prisma.user.findFirst({
      where: {
        id: { not: id }, // exclude current user
        OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
      },
    });

    if (existingData) {
      if (existingData.email === data.email) {
        // * 409 = duplicate data
        throw new ConflictException('Email already exists');
      }

      if (existingData.phoneNumber === data.phoneNumber) {
        // * 409 = duplicate data
        throw new ConflictException('Phone number already exists');
      }
    }

    // * Check if user update the password: (we need to hash it)
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    // * Save new data to user
    await this.prisma.user.update({ where: { id }, data });
  }

  // * Upload profile image
  async uploadProfileImage(id: string, filename: string) {
    // * Get User to check image
    const user = await this.findOne(id);

    // * Remove old image
    if (user.profileImage !== DEFAULT_PROFILE_IMAGE) {
      // * Create path of image
      const oldImagePath = join(
        process.cwd(),
        `./images/users/profile/${user.profileImage}`,
      );

      // * Check if image already in server
      if (!existsSync(oldImagePath)) {
        throw new BadRequestException('There is No Profile Image In DataBase');
      }

      // * Remove image
      unlinkSync(oldImagePath);
    }

    // * Set new image name in DB
    await this.prisma.user.update({
      where: { id },
      data: {
        profileImage: filename,
      },
    });
  }

  // * Remove profile image
  async removeProfileImage(id: string) {
    // * Get User to check image
    const user = await this.findOne(id);

    // * Check user if already set image
    if (user.profileImage === DEFAULT_PROFILE_IMAGE) {
      throw new BadRequestException('There is No Profile Image');
    }

    // * Create path of image
    const imagePath = join(
      process.cwd(),
      `./images/users/profile/${user.profileImage}`,
    );

    // * Check if image already in server
    if (!existsSync(imagePath)) {
      throw new BadRequestException('There is No Profile Image To Remove');
    }

    // * Remove image
    unlinkSync(imagePath);

    // * Update data of user
    await this.prisma.user.update({
      where: { id },
      data: {
        profileImage: DEFAULT_PROFILE_IMAGE,
      },
    });
  }

  // * Get Image
  async findImage(id: string, image: string, res: Response) {
    // * Check the user has this image
    const user = await this.findOne(id);
    if (user.profileImage !== image) {
      throw new NotFoundException('There is No Profile Image To Show');
    }

    // * Check if image is already exist
    const imagePath = join(process.cwd(), 'images/users/profile', image);
    if (!existsSync(imagePath)) {
      throw new BadRequestException('There is No Profile Image');
    }

    // * Send file to client
    return res.sendFile(imagePath);
  }

  // ! Private Attributes
  // * Get one user
  private async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: { notIn: [Role.OWNER, Role.MEMBER] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        birthDate: true,
        userName: true,
        email: true,
        phoneNumber: true,
        companyName: true,
        role: true,
        profileImage: true,
        isAccountVerified: true,
        accountStatus: true,
        termsAccepted: true,
        createdAt: true,
        updatedAt: true,

        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    return user;
  }
}
