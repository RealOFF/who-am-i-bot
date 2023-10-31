import { z } from 'zod';

export const attendGameSchema = z.object({
  gameCode: z.string(),
  userId: z.number(),
});
