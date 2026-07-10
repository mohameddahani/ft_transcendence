import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UpdateUserDto } from './dtos/update-user.dto';
import { DEFAULT_PROFILE_IMAGE } from './constants/users.constants';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { UserType } from '@/generated/prisma/enums';

@Injectable()
export class UsersService {
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
        userType: true,
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

  // // * Update data of user
  // async update(id: string, data: UpdateUserDto) {
  //   // * Check if we have user already in DB
  //   await this.findOne(id);

  //   // * Check if user update the username: (we need to check if username is unique)
  //   const existingData = await this.prisma.user.findFirst({
  //     where: {
  //       id: { not: id }, // exclude current user
  //       OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
  //     },
  //   });

  //   if (existingData) {
  //     if (existingData.email === data.email) {
  //       // * 409 = duplicate data
  //       throw new ConflictException('Email already exists');
  //     }

  //     if (existingData.phoneNumber === data.phoneNumber) {
  //       // * 409 = duplicate data
  //       throw new ConflictException('Phone number already exists');
  //     }
  //   }

  //   // * Check if user update the password: (we need to hash it)
  //   if (data.password) {
  //     data.password = await bcrypt.hash(data.password, 10);
  //   }

  //   // * Save new data to user
  //   await this.prisma.user.update({ where: { id }, data });
  // }

  // // * Upload profile image
  // async uploadProfileImage(id: string, filename: string) {
  //   // * Check if we have user already in DB
  //   const user = await this.findOne(id);

  //   // * Remove old image
  //   if (user.profileImage !== DEFAULT_PROFILE_IMAGE) {
  //     // * Create path of image
  //     const oldImagePath = join(
  //       process.cwd(),
  //       `./images/users/profile/${user.profileImage}`,
  //     );

  //     // * Check if image already in server
  //     if (!existsSync(oldImagePath)) {
  //       throw new BadRequestException('There is No Profile Image In DataBase');
  //     }

  //     // * Remove image
  //     unlinkSync(oldImagePath);
  //   }

  //   // * Set new image name in DB
  //   await this.prisma.user.update({
  //     where: { id },
  //     data: {
  //       profileImage: filename,
  //     },
  //   });
  // }

  // // * Remove profile image
  // async removeProfileImage(id: string) {
  //   // * Check if we have user already in DB
  //   const user = await this.findOne(id);

  //   // * Check user if already set image
  //   if (user.profileImage === DEFAULT_PROFILE_IMAGE) {
  //     throw new BadRequestException('There is No Profile Image');
  //   }

  //   // * Create path of image
  //   const imagePath = join(
  //     process.cwd(),
  //     `./images/users/profile/${user.profileImage}`,
  //   );

  //   // * Check if image already in server
  //   if (!existsSync(imagePath)) {
  //     throw new BadRequestException('There is No Profile Image In DataBase');
  //   }

  //   // * Remove image
  //   unlinkSync(imagePath);

  //   // * Update data of user
  //   await this.prisma.user.update({
  //     where: { id },
  //     data: {
  //       profileImage: DEFAULT_PROFILE_IMAGE,
  //     },
  //   });
  // }

  // // ! Private Attributes
  // // * Get one user
  // async findOne(id: string) {
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       id,
  //       userType: { notIn: [UserType.OWNER, UserType.USER] },
  //     },
  //     select: {
  //       id: true,
  //       firstName: true,
  //       lastName: true,
  //       gender: true,
  //       birthDate: true,
  //       userName: true,
  //       email: true,
  //       phoneNumber: true,
  //       companyName: true,
  //       userType: true,
  //       profileImage: true,
  //       isAccountVerified: true,
  //       accountStatus: true,
  //       termsAccepted: true,
  //       createdAt: true,
  //       updatedAt: true,

  //       subscription: {
  //         include: {
  //           plan: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!user) {
  //     throw new NotFoundException('User Not Found');
  //   }

  //   return user;
  // }
}
