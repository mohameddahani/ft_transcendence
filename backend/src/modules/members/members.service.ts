// import { PrismaService } from '@/infrastructure/database/prisma.service';
// import { AddMemberDto } from './dtos/add-member.dto';
// import { generateUsername } from '@/core/utils/generate-username';
// import {
//   BadRequestException,
//   ConflictException,
//   ForbiddenException,
//   Injectable,
//   NotFoundException,
//   UnauthorizedException,
// } from '@nestjs/common';
// import {
//   AccountStatus,
//   MemberStatus,
//   PaymentStatus,
//   SubscriptionStatus,
// } from '@/generated/prisma/enums';
// import { UpdateMemberDto } from './dtos/update-member.dto';

// @Injectable()
// export class MembersService {
//   constructor(private readonly prisma: PrismaService) {}

//   // * Add Member by Admin
//   async addMember(adminId: string, data: AddMemberDto) {
//     // * Check if admin is has already a subscription
//     const subscription = await this.checkIfAdminHasSubscription(adminId);

//     // * Check if admin has place for new member
//     // * Count Members
//     const membersCount = await this.prisma.member.count({
//       where: {
//         adminId,
//       },
//     });
//     if (membersCount >= subscription.plan.maxMembers) {
//       throw new ForbiddenException(
//         `You have reached the maximum number of members allowed by your current plan (${subscription.plan.maxMembers}). Please upgrade your subscription to add more members.`,
//       );
//     }

//     // * Check if Admin Has Membership Plan With Duration
//     const { duration, membershipPlan } =
//       await this.checkIfAdminHasMembershipPlanWithDuration(
//         adminId,
//         data.membershipPlanId,
//         data.membershipPlanDurationId,
//       );

//     // * Check if memberhsip Plan is active
//     if (!membershipPlan.isActive) {
//       throw new ConflictException(
//         'The selected membership plan is no longer available. Please choose another active membership plan.',
//       );
//     }

//     // * Check if member already exist
//     const existingMember = await this.prisma.member.findFirst({
//       where: {
//         adminId: adminId,
//         OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
//       },
//     });
//     if (existingMember) {
//       if (existingMember.email === data.email) {
//         throw new UnauthorizedException('Email already exists');
//       }

//       if (existingMember.phoneNumber === data.phoneNumber) {
//         throw new UnauthorizedException('Phone number already exists');
//       }
//     }

//     // * Genarate a userName
//     let userName: string;
//     while (true) {
//       userName = generateUsername(data.firstName, data.lastName);

//       // * Check if username already exist before register
//       const existingUserName = await this.prisma.member.findUnique({
//         where: {
//           userName: userName,
//         },
//       });
//       if (!existingUserName) {
//         break;
//       }
//     }

//     // * Add members to database
//     const member = await this.prisma.member.create({
//       data: {
//         admin: { connect: { id: adminId } },
//         firstName: data.firstName,
//         lastName: data.lastName,
//         gender: data.gender,
//         birthDate: data.birthDate,
//         userName: userName,
//         email: data.email,
//         phoneNumber: data.phoneNumber,
//         address: data.address,
//         emergencyContact: data.emergencyContact,
//       },
//     });
//     if (!member) {
//       throw new BadRequestException('Somthing Went Wrong');
//     }

//     // * Add Membership of member
//     const expiresAt = new Date(); // ex: 2026-06-19 20:30:15
//     expiresAt.setDate(expiresAt.getDate() + duration.durationDays); // 19 + 30 => July 19th
//     const membership = await this.prisma.membership.create({
//       data: {
//         admin: { connect: { id: adminId } },
//         member: { connect: { id: member.id } },
//         membershipPlan: { connect: { id: data.membershipPlanId } },
//         membershipPlanDuration: {
//           connect: { id: data.membershipPlanDurationId },
//         },
//         expiresAt: expiresAt,
//       },
//       include: {
//         membershipPlanDuration: true,
//       },
//     });

//     // * Add Payment of Member
//     await this.prisma.payment.create({
//       data: {
//         member: { connect: { id: member.id } },
//         admin: { connect: { id: adminId } },
//         amount: membership.membershipPlanDuration.price,
//         paidAt: membership.startDate,
//         dueDate: membership.expiresAt,
//         status: PaymentStatus.PAID,
//       },
//     });
//   }

//   // * Update data of member
//   async update(adminId: string, memberId: string, data: UpdateMemberDto) {
//     // * Check if admin is has already a subscription
//     await this.checkIfAdminHasSubscription(adminId);

//     // * Check if we have member already in DB
//     await this.findOne(adminId, memberId);

//     // * Check if member data duplicate
//     const existingData = await this.prisma.member.findFirst({
//       where: {
//         id: {
//           not: memberId,
//         },
//         adminId: adminId,
//         OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
//       },
//     });

//     if (existingData) {
//       if (existingData.email === data.email) {
//         // * 409 = duplicate data
//         throw new ConflictException('Email already exists');
//       }

//       if (existingData.phoneNumber === data.phoneNumber) {
//         // * 409 = duplicate data
//         throw new ConflictException('Phone number already exists');
//       }
//     }

//     // * Save new data to member
//     await this.prisma.member.update({
//       where: {
//         id: memberId,
//         adminId: adminId,
//       },
//       data: {
//         firstName: data.firstName,
//         lastName: data.lastName,
//         gender: data.gender,
//         birthDate: data.birthDate,
//         email: data.email,
//         phoneNumber: data.phoneNumber,
//         address: data.address,
//         emergencyContact: data.emergencyContact,
//       },
//     });

//     // * check if the admin update the membership plan
//     if (data.membershipPlanId && data.membershipPlanDurationId) {
//       // * Check if Admin Has Membership Plan With Duration
//       const { duration, membershipPlan } =
//         await this.checkIfAdminHasMembershipPlanWithDuration(
//           adminId,
//           data.membershipPlanId,
//           data.membershipPlanDurationId,
//         );

//       // * Check if memberhsip Plan is active
//       if (!membershipPlan.isActive) {
//         throw new ConflictException(
//           'The selected membership plan is no longer available. Please choose another active membership plan.',
//         );
//       }

//       // * Check Membership Before update
//       const membership = await this.prisma.membership.findFirst({
//         where: {
//           adminId: adminId,
//           memberId: memberId,
//         },
//       });
//       if (!membership) {
//         throw new NotFoundException('Membership Not Found!');
//       }

//       // * Add new Membership to member
//       const expiresAt = new Date(); // ex: 2026-06-19 20:30:15
//       expiresAt.setDate(expiresAt.getDate() + duration.durationDays); // 19 + 30 => July 19th
//       const updatedMembership = await this.prisma.membership.update({
//         where: { id: membership.id },
//         data: {
//           membershipPlan: { connect: { id: data.membershipPlanId } },
//           membershipPlanDuration: {
//             connect: { id: data.membershipPlanDurationId },
//           },
//           startDate: new Date(),
//           expiresAt: expiresAt,
//         },
//         include: { membershipPlan: true, membershipPlanDuration: true },
//       });

//       // * Add New Payment for Updated Member
//       await this.prisma.payment.create({
//         data: {
//           member: { connect: { id: updatedMembership.memberId } },
//           admin: { connect: { id: adminId } },
//           amount: updatedMembership.membershipPlanDuration.price,
//           paidAt: updatedMembership.startDate,
//           dueDate: updatedMembership.expiresAt,
//           status: PaymentStatus.PAID,
//         },
//       });
//     } else if (
//       (data.membershipPlanId && !data.membershipPlanDurationId) ||
//       (!data.membershipPlanId && data.membershipPlanDurationId)
//     ) {
//       throw new BadRequestException(
//         'membership plan and duration must be provided together.',
//       );
//     }
//   }

//   // * Active a Member
//   async activeMember(adminId: string, memberId: string) {
//     // * Check member is exist
//     const member = await this.findOne(adminId, memberId);
//     if (member.status === MemberStatus.ACTIVE) {
//       throw new ConflictException('The Member is already Active!');
//     }

//     await this.prisma.member.update({
//       where: {
//         id: memberId,
//         adminId: adminId,
//       },
//       data: {
//         status: MemberStatus.ACTIVE,
//       },
//     });
//   }

//   // * Freeze a Member
//   async freezeMember(adminId: string, memberId: string) {
//     // * Check member exists
//     const member = await this.findOne(adminId, memberId);

//     if (member.status === MemberStatus.FROZEN) {
//       throw new ConflictException('The member is already frozen.');
//     }

//     if (member.status === MemberStatus.BANNED) {
//       throw new ConflictException(
//         'A banned member cannot be frozen. Active the member first.',
//       );
//     }

//     await this.prisma.member.update({
//       where: {
//         id: memberId,
//         adminId: adminId,
//       },
//       data: {
//         status: MemberStatus.FROZEN,
//       },
//     });
//   }

//   // * Ban a Member
//   async banMember(adminId: string, memberId: string) {
//     // * Check member exists
//     const member = await this.findOne(adminId, memberId);

//     if (member.status === MemberStatus.BANNED) {
//       throw new ConflictException('The member is already banned.');
//     }

//     await this.prisma.member.update({
//       where: {
//         id: memberId,
//         adminId: adminId,
//       },
//       data: {
//         status: MemberStatus.BANNED,
//       },
//     });
//   }

//   // * Get all Members
//   async findAll(adminId: string, page: number, limit: number) {
//     // * Check if admin is has already a subscription
//     await this.checkIfAdminHasSubscription(adminId);

//     const members = await this.prisma.member.findMany({
//       where: {
//         adminId,
//       },
//       skip: (page - 1) * limit,
//       take: limit,
//       select: {
//         id: true,
//         adminId: true,
//         firstName: true,
//         lastName: true,
//         gender: true,
//         birthDate: true,
//         userName: true,
//         email: true,
//         phoneNumber: true,
//         photo: true,
//         address: true,
//         emergencyContact: true,
//         userType: true,
//         status: true,
//         memberships: true,
//         payments: true,
//         notifications: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });
//     if (members.length === 0) {
//       throw new NotFoundException('Members Not Found!');
//     }

//     return members;
//   }

//   // * Get one Member
//   async findOne(adminId: string, memberId: string) {
//     // * Check if admin is has already a subscription
//     await this.checkIfAdminHasSubscription(adminId);

//     const member = await this.prisma.member.findFirst({
//       where: {
//         adminId,
//         id: memberId,
//       },
//       select: {
//         id: true,
//         adminId: true,
//         firstName: true,
//         lastName: true,
//         gender: true,
//         birthDate: true,
//         userName: true,
//         email: true,
//         phoneNumber: true,
//         photo: true,
//         address: true,
//         emergencyContact: true,
//         userType: true,
//         status: true,
//         memberships: true,
//         payments: true,
//         notifications: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });
//     if (!member) {
//       throw new NotFoundException('Member Not Found!');
//     }

//     return member;
//   }

//   // ! Private Attributes
//   // * Check if admin has subscription
//   private async checkIfAdminHasSubscription(adminId: string) {
//     const subscription = await this.prisma.subscription.findUnique({
//       where: { userId: adminId, status: SubscriptionStatus.ACTIVE },
//       include: { plan: true, user: true },
//     });
//     if (!subscription || !subscription.plan.isActive) {
//       throw new UnauthorizedException(
//         'You don’t have an active subscription. Upgrade your plan to continue.',
//       );
//     } else if (subscription.user.accountStatus !== AccountStatus.ACTIVE) {
//       if (subscription.user.accountStatus === AccountStatus.INACTIVE) {
//         throw new UnauthorizedException(
//           'Your account is inactive. Please activate your account to continue.',
//         );
//       } else if (subscription.user.accountStatus === AccountStatus.PENDING) {
//         throw new UnauthorizedException(
//           'Your account is currently pending approval. Please wait until your account has been reviewed, or Please contact support for assistance.',
//         );
//       } else if (subscription.user.accountStatus === AccountStatus.BANNED) {
//         throw new UnauthorizedException(
//           'Your account has been suspended. Please contact support for assistance.',
//         );
//       }
//     }

//     return subscription;
//   }

//   // * Check if Admin Has Membership Plan With Duration
//   private async checkIfAdminHasMembershipPlanWithDuration(
//     adminId: string,
//     membershipPlanId: string,
//     durationId: string,
//   ) {
//     // * Check if the admin has this membership plan
//     const membershipPlan = await this.prisma.membershipPlan.findFirst({
//       where: {
//         adminId: adminId,
//         id: membershipPlanId,
//       },
//     });
//     if (!membershipPlan) {
//       throw new NotFoundException(
//         'There is No Membership Plan, Please Add a Membership Plan',
//       );
//     }

//     // * Check if duration is already exist for this membership plan
//     const duration = await this.prisma.membershipPlanDuration.findFirst({
//       where: {
//         id: durationId,
//         membershipPlan: { adminId: adminId },
//         membershipPlanId: membershipPlan.id,
//       },
//     });
//     if (!duration) {
//       throw new NotFoundException('Duration does not exist for this plan');
//     }

//     return { duration, membershipPlan };
//   }
// }
