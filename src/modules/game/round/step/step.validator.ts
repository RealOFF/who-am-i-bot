import { z } from 'zod';

export const passStepSchema = z.object({
  userId: z.number(),
});
