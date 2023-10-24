import { BotCommand } from 'node-telegram-bot-api';
import { z } from 'zod';

export enum BotCommands {
  START = '/start',
  CREATE_GAME = '/create_game',
}

export const startSchema = z.object({
  id: z.number(),
  username: z.string(),
  language: z.string(),
});

export const createGameSchema = z.object({
  creatorId: z.number(),
  name: z.string().optional(),
});

export const COMMANDS_CONFIG: BotCommand[] = [
  {
    command: BotCommands.CREATE_GAME,
    description: 'Create new game session',
  },
];
