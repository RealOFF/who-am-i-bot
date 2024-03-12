import { z } from 'zod';

export const createGameSchema = z.object({ creatorId: z.number() });

export const startGameSchema = z.object({
  userId: z.number(),
});

export const finishGameSchema = z.object({
  userId: z.number(),
});

export const passStepSchema = z.object({
  userId: z.number(),
});
