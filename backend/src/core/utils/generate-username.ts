import slugify from 'slugify';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 3);

export const generateUsername = (
  firstName: string,
  lastName: string,
  firstNameCharCount: number,
) => {
  const options = {
    lower: true, // make all chars lower case
    strict: true, // remove all characters except letters, numbers, and the separator
    replacement: '', // replace any space by nothing
  };

  const firstN = slugify(firstName, options);
  const lastN = slugify(lastName, options);

  if (firstNameCharCount < firstN.length) {
    return `${firstN.slice(0, firstNameCharCount)}${lastN}`;
  }

  if (firstNameCharCount === firstN.length) {
    return `${firstN}-${lastN}`;
  }

  return `${firstN}-${lastN}-${nanoid(3)}`;
};
