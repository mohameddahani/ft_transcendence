import { createHash, randomBytes } from 'node:crypto';

// * Generate Action Token
export const generateActionToken = () => {
  const rawToken = randomBytes(32).toString('hex'); // * sent to user
  const tokenHash = createHash('sha256').update(rawToken).digest('hex'); // * stored in DB
  return { rawToken, tokenHash };
};
