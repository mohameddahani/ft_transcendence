// import { AccountStatus, UserType } from '@/generated/prisma/enums';
// import { PrismaService } from '@/infrastructure/database/prisma.service';
// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';

// @Injectable()
// export class OwnersService {
//   constructor(private readonly prisma: PrismaService) {}

//   // * Get all users
//   async findAll(page: number, limit: number) {
//     const users = await this.prisma.user.findMany({
//       where: {
//         userType: { notIn: [UserType.OWNER, UserType.USER] },
//       },
//       skip: (page - 1) * limit,
//       take: limit,
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         gender: true,
//         birthDate: true,
//         userName: true,
//         email: true,
//         phoneNumber: true,
//         companyName: true,
//         userType: true,
//         profileImage: true,
//         isAccountVerified: true,
//         accountStatus: true,
//         termsAccepted: true,
//         createdAt: true,
//         updatedAt: true,

//         subscription: {
//           include: {
//             plan: true,
//           },
//         },
//       },
//     });

//     if (users.length === 0) {
//       throw new NotFoundException('No Users To Show');
//     }

//     return users;
//   }

//   // * Get one user
//   async findOne(id: string) {
//     const user = await this.prisma.user.findUnique({
//       where: {
//         id,
//         userType: { notIn: [UserType.OWNER, UserType.USER] },
//       },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         gender: true,
//         birthDate: true,
//         userName: true,
//         email: true,
//         phoneNumber: true,
//         companyName: true,
//         userType: true,
//         profileImage: true,
//         isAccountVerified: true,
//         accountStatus: true,
//         termsAccepted: true,
//         createdAt: true,
//         updatedAt: true,

//         subscription: {
//           include: {
//             plan: true,
//           },
//         },
//       },
//     });

//     if (!user) {
//       throw new NotFoundException('User Not Found');
//     }

//     return user;
//   }

//   // ! Change Status Account
//   // * Active a User
//   async ActiveUser(id: string) {
//     // * Check if User already exist
//     const user = await this.findOne(id);

//     // * Check if user not Active
//     if (user.accountStatus === AccountStatus.ACTIVE) {
//       throw new BadRequestException('This account is already active.');
//     }

//     await this.prisma.user.update({
//       where: { id: id, userType: { notIn: [UserType.OWNER, UserType.USER] } },
//       data: {
//         accountStatus: AccountStatus.ACTIVE,
//       },
//     });
//   }

//   // * Pending a User
//   async pendingUser(id: string) {
//     // * Check if User already exist
//     const user = await this.findOne(id);

//     // * Check if user not Active
//     if (user.accountStatus !== AccountStatus.ACTIVE) {
//       if (user.accountStatus === AccountStatus.INACTIVE) {
//         throw new BadRequestException(
//           'Only active accounts can be moved to pending status.',
//         );
//       } else if (user.accountStatus === AccountStatus.PENDING) {
//         throw new BadRequestException('This account is already pending.');
//       } else if (user.accountStatus === AccountStatus.BANNED) {
//         throw new BadRequestException(
//           'A banned account cannot be moved to pending. Please reactivate the account first if appropriate.',
//         );
//       }
//     }

//     await this.prisma.user.update({
//       where: { id: id, userType: { notIn: [UserType.OWNER, UserType.USER] } },
//       data: {
//         accountStatus: AccountStatus.PENDING,
//       },
//     });
//   }

//   // * Ban a User
//   async banUser(id: string) {
//     // * Check if User already exist
//     const user = await this.findOne(id);

//     // * Check if user not Active
//     if (user.accountStatus !== AccountStatus.ACTIVE) {
//       if (user.accountStatus === AccountStatus.INACTIVE) {
//         throw new BadRequestException(
//           'Only active accounts can be moved to banned status.',
//         );
//       } else if (user.accountStatus === AccountStatus.BANNED) {
//         throw new BadRequestException('This account is already banned.');
//       }
//     }

//     await this.prisma.user.update({
//       where: { id: id, userType: { notIn: [UserType.OWNER, UserType.USER] } },
//       data: {
//         accountStatus: AccountStatus.BANNED,
//       },
//     });
//   }
// }
