// * default-avatars.ts
export const DEFAULT_AVATARS = {
  OWNER:
    'https://res.cloudinary.com/dtu6nxcq7/image/upload/v1790521907/avatars-default-owner.png',
  ADMIN:
    'https://res.cloudinary.com/dtu6nxcq7/image/upload/v1790521752/avatars-default-admin.png',
  STAFF:
    'https://res.cloudinary.com/dtu6nxcq7/image/upload/v1790521794/avatars-default-staff.png',
  MEMBER:
    'https://res.cloudinary.com/dtu6nxcq7/image/upload/v1790521882/avatars-default-member.png',
} as const;

export const DEFAULT_AVATARS_ID = {
  OWNER: 'avatars-default-owner',
  ADMIN: 'avatars-default-admin',
  STAFF: 'avatars-default-staff',
  MEMBER: 'avatars-default-member',
} as const;
