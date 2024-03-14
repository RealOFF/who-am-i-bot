import { z } from 'zod';

export const authSchema = z.object({
  id: z.number(),
  username: z.string(),
  language: z.string(),
});
