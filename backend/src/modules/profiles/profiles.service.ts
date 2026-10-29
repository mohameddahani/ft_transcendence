/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileUserDto } from './dtos/update-profile-user.dto';
import { ActionTokenType, Role } from '@/generated/prisma/enums';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';
import {
  privateMemberSelect,
  privateStaffSelect,
  privateUserSelect,
  publicUserSelect,
} from '@/core/types/safe-selects.type';
import {
  DEFAULT_AVATARS,
  DEFAULT_AVATARS_ID,
} from '@/core/constants/default-avatars.constants';
import { UpdateProfileMemberDto } from './dtos/update-profile-member.dto';
import { UpdateProfileStaffDto } from './dtos/update-profile-staff.dto';
import { generateActionToken } from '@/core/utils/generate-action-token';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';
import { EmailService } from '@/infrastructure/email/email.service';
import { RequestEmailChangeUserDto } from './dtos/request-email-change-user.dto';
import { RequestEmailChangeMemberDto } from './dtos/request-email-change-member.dto';
import { RequestEmailChangeStaffDto } from './dtos/request-email-change-staff.dto';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
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
      select: privateUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    return user;
  }

  // * Update data of user
  async update(id: string, data: UpdateProfileUserDto) {
    // * Check if phone number is already used by another user
    if (data.phoneNumber !== undefined) {
      const existingPhoneNumber = await this.prisma.user.findFirst({
        where: {
          id: {
            not: id,
          },
          phoneNumber: data.phoneNumber,
        },
        select: {
          id: true,
        },
      });

      if (existingPhoneNumber) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // * Check if user update the password: (we need to hash it)
    if (
      (!data.password && data.currentPassword) ||
      (data.password && !data.currentPassword)
    ) {
      throw new BadRequestException(
        'Both current password and password are required to change the password.',
      );
    } else if (data.password && data.currentPassword) {
      // * Check Current Password
      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        throw new NotFoundException('User Not Found.');
      }

      const passwordIsMatch = await bcrypt.compare(
        data.currentPassword,
        user.password,
      );

      if (!passwordIsMatch) {
        throw new UnauthorizedException('Invalid Current Password');
      }

      data.password = await bcrypt.hash(data.password, 10);
    }

    // * Exclude the current password
    const { currentPassword, ...profileData } = data;

    // * Save new data to user
    return await this.prisma.user.update({
      where: { id },
      data: profileData,
      select: privateUserSelect,
    });
  }

  // * Request email change
  async requestEmailChange(id: string, data: RequestEmailChangeUserDto) {
    // * Find current user
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // * New email must be different from current email
    if (user.email === data.email) {
      throw new BadRequestException(
        'The new email address must be different from your current email address.',
      );
    }

    // * Check if new email is already used
    const existingEmail = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
      select: {
        id: true,
      },
    });

    if (existingEmail) {
      throw new ConflictException('Email address already exists');
    }

    // * Reauthenticate user with current password
    const passwordIsMatch = await bcrypt.compare(
      data.currentPassword,
      user.password,
    );

    if (!passwordIsMatch) {
      throw new UnauthorizedException('Invalid current password');
    }

    // * Generate email-change token
    const { rawToken, tokenHash } = generateActionToken();

    const emailChangeTokenExpiresIn = this.config.getOrThrow<StringValue>(
      'EMAIL_CHANGE_TOKEN_EXPIRES_IN',
    );

    const expiresAt = new Date(Date.now() + ms(emailChangeTokenExpiresIn));

    const now = new Date();

    // * Invalidate previous email-change requests
    // * and create the new request atomically
    const actionToken = await this.prisma.$transaction(async (tx) => {
      await tx.userActionToken.updateMany({
        where: {
          userId: user.id,
          type: ActionTokenType.EMAIL_CHANGE,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });

      return tx.userActionToken.create({
        data: {
          user: {
            connect: {
              id: user.id,
            },
          },
          tokenHash,
          type: ActionTokenType.EMAIL_CHANGE,
          pendingEmail: data.email,
          expiresAt,
        },
      });
    });

    try {
      // * Send verification to NEW email
      await this.emailService.sendEmailChangeVerification(data.email, rawToken);
    } catch {
      // * Token was not delivered, so invalidate it
      await this.prisma.userActionToken.deleteMany({
        where: {
          id: actionToken.id,
        },
      });

      throw new InternalServerErrorException(
        'We could not send the email change verification message. Please try again later.',
      );
    }

    return {
      message: 'A verification email has been sent to your new email address.',
    };
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
    const oldProfileImagePublicId =
      user.profileImagePublicId === DEFAULT_AVATARS_ID.ADMIN
        ? null
        : user.profileImagePublicId;

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
    if (user.profileImagePublicId === DEFAULT_AVATARS_ID.ADMIN) {
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
          profileImageUrl: DEFAULT_AVATARS.ADMIN,
          profileImagePublicId: DEFAULT_AVATARS_ID.ADMIN,
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
      select: privateMemberSelect,
    });

    if (!member) {
      throw new NotFoundException('Member Not Found');
    }

    return member;
  }

  // * Update data of member
  async updateProfileMember(memberId: string, data: UpdateProfileMemberDto) {
    // * Check if phone number is already used by another member
    if (data.phoneNumber !== undefined) {
      const existingPhoneNumber = await this.prisma.member.findFirst({
        where: {
          id: {
            not: memberId,
          },
          phoneNumber: data.phoneNumber,
        },
        select: {
          id: true,
        },
      });

      if (existingPhoneNumber) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // * Check if member update the password: (we need to hash it)
    if (
      (!data.password && data.currentPassword) ||
      (data.password && !data.currentPassword)
    ) {
      throw new BadRequestException(
        'Both current password and password are required to change the password.',
      );
    } else if (data.password && data.currentPassword) {
      // * Check Current Password
      const member = await this.prisma.member.findUnique({
        where: {
          id: memberId,
        },
      });

      if (!member) {
        throw new NotFoundException('Member Not Found.');
      }

      // * Check if Member has already password
      if (!member.password) {
        throw new BadRequestException(
          'You must set your password using the link sent to your email.',
        );
      } else {
        const passwordIsMatch = await bcrypt.compare(
          data.currentPassword,
          member.password,
        );

        if (!passwordIsMatch) {
          throw new UnauthorizedException('Invalid Current Password');
        }

        data.password = await bcrypt.hash(data.password, 10);
      }
    }

    // * Exclude the current password
    const { currentPassword, ...profileData } = data;

    // * Save new data to member
    return await this.prisma.member.update({
      where: { id: memberId },
      data: profileData,
      select: privateMemberSelect,
    });
  }

  // * Request email change (Member)
  async requestEmailChangeMember(
    id: string,
    data: RequestEmailChangeMemberDto,
  ) {
    // * Find current member
    const member = await this.prisma.member.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        adminId: true,
        email: true,
        password: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // * Member must already have a password
    if (!member.password) {
      throw new BadRequestException(
        'You must set your password before changing your email address. Please try to login to set your password',
      );
    }

    // * New email must be different from current email
    if (member.email === data.email) {
      throw new BadRequestException(
        'The new email address must be different from your current email address.',
      );
    }

    // * Check if new email is already used in this tenant
    const existingEmail = await this.prisma.member.findUnique({
      where: {
        adminId_email: {
          adminId: member.adminId,
          email: data.email,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingEmail) {
      throw new ConflictException('Email address already exists');
    }

    // * Reauthenticate member
    const passwordIsMatch = await bcrypt.compare(
      data.currentPassword,
      member.password,
    );

    if (!passwordIsMatch) {
      throw new UnauthorizedException('Invalid current password');
    }

    // * Generate email-change token
    const { rawToken, tokenHash } = generateActionToken();

    const emailChangeTokenExpiresIn = this.config.getOrThrow<StringValue>(
      'EMAIL_CHANGE_TOKEN_EXPIRES_IN',
    );

    const expiresAt = new Date(Date.now() + ms(emailChangeTokenExpiresIn));

    const now = new Date();

    // * Invalidate previous requests and create new request
    const actionToken = await this.prisma.$transaction(async (tx) => {
      await tx.memberActionToken.updateMany({
        where: {
          memberId: member.id,
          type: ActionTokenType.EMAIL_CHANGE,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });

      return tx.memberActionToken.create({
        data: {
          member: {
            connect: {
              id: member.id,
            },
          },
          tokenHash,
          type: ActionTokenType.EMAIL_CHANGE,
          pendingEmail: data.email,
          expiresAt,
        },
      });
    });

    try {
      // * Send verification to NEW email
      await this.emailService.sendEmailChangeVerificationMember(
        data.email,
        rawToken,
      );
    } catch {
      // * Token was not delivered
      await this.prisma.memberActionToken.deleteMany({
        where: {
          id: actionToken.id,
        },
      });

      throw new InternalServerErrorException(
        'We could not send the email change verification message. Please try again later.',
      );
    }

    return {
      message: 'A verification email has been sent to your new email address.',
    };
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
    const oldProfileImagePublicId =
      member.profileImagePublicId === DEFAULT_AVATARS_ID.MEMBER
        ? null
        : member.profileImagePublicId;

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
    if (member.profileImagePublicId === DEFAULT_AVATARS_ID.MEMBER) {
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
          profileImageUrl: DEFAULT_AVATARS.MEMBER,
          profileImagePublicId: DEFAULT_AVATARS_ID.MEMBER,
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

  /* 
  =========================
  ! Staffs Profile
  =========================
  */

  // * Get current Staff
  async findMeStaff(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      select: {
        ...privateStaffSelect,
        admin: {
          select: publicUserSelect,
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff Not Found');
    }

    return staff;
  }

  // * Update data of staff
  async updateProfileStaff(staffId: string, data: UpdateProfileStaffDto) {
    // * Check if phone number is already used by another staff
    if (data.phoneNumber !== undefined) {
      const existingPhoneNumber = await this.prisma.staff.findFirst({
        where: {
          id: {
            not: staffId,
          },
          phoneNumber: data.phoneNumber,
        },
        select: {
          id: true,
        },
      });

      if (existingPhoneNumber) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // * Check if staff update the password: (we need to hash it)
    if (
      (!data.password && data.currentPassword) ||
      (data.password && !data.currentPassword)
    ) {
      throw new BadRequestException(
        'Both current password and password are required to change the password.',
      );
    } else if (data.password && data.currentPassword) {
      // * Check Current Password
      const staff = await this.prisma.staff.findUnique({
        where: {
          id: staffId,
        },
      });

      if (!staff) {
        throw new NotFoundException('Staff Not Found.');
      }

      // * Check if Staff has already password
      if (!staff.password) {
        throw new BadRequestException(
          'You must set your password using the link sent to your email.',
        );
      } else {
        const passwordIsMatch = await bcrypt.compare(
          data.currentPassword,
          staff.password,
        );

        if (!passwordIsMatch) {
          throw new UnauthorizedException('Invalid Current Password');
        }

        data.password = await bcrypt.hash(data.password, 10);
      }
    }

    // * Exclude the current password
    const { currentPassword, ...profileData } = data;

    // * Save new data to staff
    return await this.prisma.staff.update({
      where: { id: staffId },
      data: profileData,
      select: privateStaffSelect,
    });
  }

  // * Request email change (Staff)
  async requestEmailChangeStaff(id: string, data: RequestEmailChangeStaffDto) {
    // * Find current staff
    const staff = await this.prisma.staff.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        adminId: true,
        email: true,
        password: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // * Staff must already have a password
    if (!staff.password) {
      throw new BadRequestException(
        'You must set your password before changing your email address. Please try to login to set your password',
      );
    }

    // * New email must be different from current email
    if (staff.email === data.email) {
      throw new BadRequestException(
        'The new email address must be different from your current email address.',
      );
    }

    // * Check if new email is already used
    const existingEmail = await this.prisma.staff.findUnique({
      where: {
        adminId_email: {
          adminId: staff.adminId,
          email: data.email,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingEmail) {
      throw new ConflictException('Email address already exists');
    }

    // * Reauthenticate staff with current password
    const passwordIsMatch = await bcrypt.compare(
      data.currentPassword,
      staff.password,
    );

    if (!passwordIsMatch) {
      throw new UnauthorizedException('Invalid current password');
    }

    // * Generate email-change token
    const { rawToken, tokenHash } = generateActionToken();

    const emailChangeTokenExpiresIn = this.config.getOrThrow<StringValue>(
      'EMAIL_CHANGE_TOKEN_EXPIRES_IN',
    );

    const expiresAt = new Date(Date.now() + ms(emailChangeTokenExpiresIn));

    const now = new Date();

    // * Invalidate previous email-change requests
    // * and create new request atomically
    const actionToken = await this.prisma.$transaction(async (tx) => {
      await tx.staffActionToken.updateMany({
        where: {
          StaffId: staff.id,
          type: ActionTokenType.EMAIL_CHANGE,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });

      return tx.staffActionToken.create({
        data: {
          staff: {
            connect: {
              id: staff.id,
            },
          },
          tokenHash,
          type: ActionTokenType.EMAIL_CHANGE,
          pendingEmail: data.email,
          expiresAt,
        },
      });
    });

    try {
      // * Send verification to NEW email
      await this.emailService.sendEmailChangeVerificationStaff(
        data.email,
        rawToken,
      );
    } catch {
      // * Remove token because email was not delivered
      await this.prisma.staffActionToken.deleteMany({
        where: {
          id: actionToken.id,
        },
      });

      throw new InternalServerErrorException(
        'We could not send the email change verification message. Please try again later.',
      );
    }

    return {
      message: 'A verification email has been sent to your new email address.',
    };
  }

  // * Upload profile image (Staff)
  async uploadProfileImageStaff(id: string, file: Express.Multer.File) {
    // * Get Staff to check image
    const staff = await this.findOneStaff(id);

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
    const oldProfileImagePublicId =
      staff.profileImagePublicId === DEFAULT_AVATARS_ID.STAFF
        ? null
        : staff.profileImagePublicId;

    try {
      // * Upload Image To Cloudinary
      const uploadedImage = await this.cloudinaryService.upload(
        file,
        'images/staffs/profile',
      );

      // * Set new image name in DB
      await this.prisma.staff.update({
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

  // * Remove profile image (Staff)
  async removeProfileImageStaff(id: string) {
    // * Get Staff to check image
    const staff = await this.findOneStaff(id);

    // * Check staff if already set image
    if (staff.profileImagePublicId === DEFAULT_AVATARS_ID.STAFF) {
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
      await this.cloudinaryService.delete(staff.profileImagePublicId);

      // * Update data of staff
      await this.prisma.staff.update({
        where: { id },
        data: {
          profileImageUrl: DEFAULT_AVATARS.STAFF,
          profileImagePublicId: DEFAULT_AVATARS_ID.STAFF,
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
        ...privateUserSelect,

        profileImagePublicId: true,
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
      select: { ...privateMemberSelect, profileImagePublicId: true },
    });

    if (!member) {
      throw new NotFoundException('Member Not Found');
    }

    return member;
  }

  // * Get one Staff
  private async findOneStaff(id: string) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id,
        role: { notIn: [Role.OWNER, Role.ADMIN] },
      },
      select: {
        ...privateStaffSelect,
        profileImagePublicId: true,
        admin: {
          select: privateUserSelect,
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff Not Found');
    }

    return staff;
  }
}
