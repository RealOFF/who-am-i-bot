import type { BotCommand } from 'node-telegram-bot-api';

export enum BotCommands {
  START = '^/start\\b',
  ATTEND_GAME = '/start (.+)',
  CREATE_GAME = '/create_game',
  START_GAME = '/start_game',
}

export const COMMANDS_CONFIG: BotCommand[] = [
  {
    command: BotCommands.CREATE_GAME,
    description: 'Create new game session',
  },
  {
    command: BotCommands.START_GAME,
    description: 'Start game process',
  },
];
