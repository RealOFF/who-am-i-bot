import { z } from 'zod';

export const startSchema = z.object({
  id: z.number(),
  username: z.string(),
  language: z.string(),
});
