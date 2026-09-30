import slugify from 'slugify';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 4);

export const generateUsername = (firstName: string, lastName: string) => {
  const slug = slugify(`${firstName} ${lastName}`, {
    lower: true,
    strict: true, // remove all characters except letters, numbers, and the separator
  });

  return `${slug}-${nanoid(5)}`;
};
