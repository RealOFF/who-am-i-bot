import { z } from 'zod';

export enum MessageCommands {
  SET_GAME_NAME,
}

export const createGameSchema = z.object({
  creatorId: z.number(),
  name: z.string().optional(),
});
