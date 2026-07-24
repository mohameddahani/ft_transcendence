// * Check if member has membership
  private async checkIfMemberHasMembership(memberId: string) {
    // * Check if member already exist
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        payments: true,
      },
    });
    if (!member) {
      throw new NotFoundException('Member Not Found !');
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        memberId: member.id,
        adminId: member.adminId,
        status: MembershipStatus.ACTIVE,
      },
    });
    if (!membership) {
      throw new UnauthorizedException(
        'You don’t have an membership. Upgrade your plan to continue.',
      );
    }

    return { member, membership };
  }