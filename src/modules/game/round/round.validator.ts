import { z } from 'zod';

export const finishRoundSchema = z.object({
  userId: z.number(),
});
