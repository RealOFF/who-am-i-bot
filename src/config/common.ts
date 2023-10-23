import z from 'zod';

const schema = z.object({
  BOT_TOKEN: z.string(),
  IS_PROD: z.boolean(),
});

export const CommonConfig = schema.parse({
  BOT_TOKEN: process.env.BOT_TOKEN,
  IS_PROD: process.env.NODE_ENV === 'production'
})
