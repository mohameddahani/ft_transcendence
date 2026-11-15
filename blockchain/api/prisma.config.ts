import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/shema.prisma',

  datasource: {
    // Client generation during image builds does not need DB credentials.
    url: process.env.REWARDS_DATABASE_URL,
  },
});
