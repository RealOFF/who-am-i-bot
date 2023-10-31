import z from 'zod';

const schema = z.object({
  BOT_TOKEN: z.string(),
  BOT_NAME: z.string(),
  IS_PROD: z.boolean(),
  DATABASE_URL: z.string(),
});

export const CommonConfig = schema.parse({
  BOT_TOKEN: process.env.BOT_TOKEN,
  BOT_NAME: process.env.BOT_NAME,
  IS_PROD: process.env.NODE_ENV === 'production',
  DATABASE_URL: process.env.DATABASE_URL,
});
