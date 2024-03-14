import { z } from 'zod';

export const createGameSchema = z.object({ creatorId: z.number() });

export const startGameSchema = z.object({
  userId: z.number(),
});
