import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { DEFAULT_PROFILE_IMAGE } from './constants/users.constants';
import { Role } from '@/generated/prisma/enums';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /* 
  =========================
  ! Owner / Admin Profile
  =========================
  */

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
        profileImageUrl: true,
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
  async uploadProfileImage(id: string, file: Express.Multer.File) {
    // * Get User to check image
    const user = await this.findOne(id);

    // ! Only if we storage the file in Server
    // // * Remove old image
    // if (user.profileImageUrl !== DEFAULT_PROFILE_IMAGE) {
    //   // ! This Options if we need to store image inside Server
    // // * Create path of image
    // const oldImagePath = join(
    //   process.cwd(),
    //   `./images/users/profile/${user.profileImage}`,
    // );
    // // * Check if image already in server
    // if (!existsSync(oldImagePath)) {
    //   throw new BadRequestException('There is No Profile Image In DataBase');
    // }
    // unlinkSync(oldImagePath);
    //   // * Remove image From Cloudinary
    // }

    // * Get Old Profile Image Public Id of image
    const oldProfileImagePublicId = user.profileImagePublicId;

    try {
      // * Upload Image To Cloudinary
      const uploadedImage = await this.cloudinaryService.upload(
        file,
        'images/users/profile',
      );

      // * Set new image name in DB
      await this.prisma.user.update({
        where: { id },
        data: {
          profileImageUrl: uploadedImage.secure_url,
          profileImagePublicId: uploadedImage.public_id,
        },
      });

      // * Remove Old Image
      if (oldProfileImagePublicId) {
        await this.cloudinaryService.delete(oldProfileImagePublicId);
      }
    } catch {
      throw new InternalServerErrorException('Could not update profile image');
    }
  }

  // * Remove profile image
  async removeProfileImage(id: string) {
    // * Get User to check image
    const user = await this.findOne(id);

    // * Check user if already set image
    if (!user.profileImagePublicId) {
      throw new BadRequestException('There is No Profile Image');
    }

    // ! Only if we storage the file in Server
    // // * Create path of image
    // const imagePath = join(
    //   process.cwd(),
    //   `./images/users/profile/${user.profileImageUrl}`,
    // );

    // // * Check if image already in server
    // if (!existsSync(imagePath)) {
    //   throw new BadRequestException('There is No Profile Image To Remove');
    // }

    // // * Remove image
    // unlinkSync(imagePath);

    try {
      // * Delete Image
      await this.cloudinaryService.delete(user.profileImagePublicId);

      // * Update data of user
      await this.prisma.user.update({
        where: { id },
        data: {
          profileImageUrl: DEFAULT_PROFILE_IMAGE,
          profileImagePublicId: null,
        },
      });
    } catch {
      throw new InternalServerErrorException('Could not delete profile image');
    }
  }

  // ! with Cloudinary architecture, this method is essentially unnecessary.
  // // * Get Image
  // async findImage(id: string, res: Response) {
  //   // * Check the user has this image
  //   const user = await this.findOne(id);
  //   if (!user.profileImageUrl) {
  //     throw new NotFoundException('There is No Profile Image To Show');
  //   }

  //   // // * Check if image is already exist
  //   // const imagePath = join(process.cwd(), 'images/users/profile', image);
  //   // if (!existsSync(imagePath)) {
  //   //   throw new BadRequestException('There is No Profile Image');
  //   // }

  //   // * Send file to client
  //   return res.sendFile(user.profileImageUrl);
  // }

  /* 
  =========================
  ! Members Profile
  =========================
  */

  // * Get current Member
  async findMeMember(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      select: {
        firstName: true,
        lastName: true,
        gender: true,
        birthDate: true,
        userName: true,
        email: true,
        phoneNumber: true,
        profileImageUrl: true,
        address: true,
        emergencyContact: true,
        role: true,
        accountStatus: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member Not Found');
    }

    return member;
  }

  // * Upload profile image (Member)
  async uploadProfileImageMember(id: string, file: Express.Multer.File) {
    // * Get Member to check image
    const member = await this.findOneMember(id);

    // ! Only if we storage the file in Server
    // // * Remove old image
    // if (member.profileImageUrl !== DEFAULT_PROFILE_IMAGE_MEMBER) {
    //   // * Create path of image
    //   const oldImagePath = join(
    //     process.cwd(),
    //     `./images/users/profile/${member.profileImageUrl}`,
    //   );

    //   // * Check if image already in server
    //   if (!existsSync(oldImagePath)) {
    //     throw new BadRequestException('There is No Profile Image In DataBase');
    //   }

    //   // * Remove image
    //   unlinkSync(oldImagePath);
    // }

    // * Get Old Profile Image Public Id of image
    const oldProfileImagePublicId = member.profileImagePublicId;

    try {
      // * Upload Image To Cloudinary
      const uploadedImage = await this.cloudinaryService.upload(
        file,
        'images/members/profile',
      );

      // * Set new image name in DB
      await this.prisma.member.update({
        where: { id },
        data: {
          profileImageUrl: uploadedImage.secure_url,
          profileImagePublicId: uploadedImage.public_id,
        },
      });

      // * Remove Old Image
      if (oldProfileImagePublicId) {
        await this.cloudinaryService.delete(oldProfileImagePublicId);
      }
    } catch {
      throw new InternalServerErrorException('Could not update profile image');
    }
  }

  // * Remove profile image (Member)
  async removeProfileImageMember(id: string) {
    // * Get Member to check image
    const member = await this.findOneMember(id);

    // * Check member if already set image
    if (!member.profileImagePublicId) {
      throw new BadRequestException('There is No Profile Image');
    }

    // ! Only if we storage the file in Server
    // * Create path of image
    // const imagePath = join(
    //   process.cwd(),
    //   `./images/users/profile/${member.profileImageUrl}`,
    // );

    // // * Check if image already in server
    // if (!existsSync(imagePath)) {
    //   throw new BadRequestException('There is No Profile Image To Remove');
    // }

    // // * Remove image
    // unlinkSync(imagePath);

    try {
      // * Delete Image
      await this.cloudinaryService.delete(member.profileImagePublicId);

      // * Update data of member
      await this.prisma.member.update({
        where: { id },
        data: {
          profileImageUrl: DEFAULT_PROFILE_IMAGE,
          profileImagePublicId: null,
        },
      });
    } catch {
      throw new InternalServerErrorException('Could not delete profile image');
    }
  }

  // ! with Cloudinary architecture, this method is essentially unnecessary.
  // // * Get Image (Member)
  // async findImageMember(id: string, image: string, res: Response) {
  //   // * Check the member has this image
  //   const member = await this.findOneMember(id);
  //   if (member.profileImageUrl !== image) {
  //     throw new NotFoundException('There is No Profile Image To Show');
  //   }

  //   // * Check if image is already exist
  //   const imagePath = join(process.cwd(), 'images/users/profile', image);
  //   if (!existsSync(imagePath)) {
  //     throw new BadRequestException('There is No Profile Image');
  //   }

  //   // * Send file to client
  //   return res.sendFile(imagePath);
  // }

  // ! Private Attributes
  // * Get one user
  private async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: { notIn: [Role.MEMBER] },
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
        profileImageUrl: true,
        profileImagePublicId: true,
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

  // * Get one Member
  private async findOneMember(id: string) {
    const member = await this.prisma.member.findFirst({
      where: {
        id,
        role: { notIn: [Role.OWNER, Role.ADMIN] },
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
        profileImageUrl: true,
        profileImagePublicId: true,
        address: true,
        emergencyContact: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member Not Found');
    }

    return member;
  }
}
