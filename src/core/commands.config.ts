import { type BotCommand } from '@telegraf/types';

export enum UserCommands {
  CREATE_GAME = 'create_game',
  START_GAME = 'start_game',
  GET_STATUS = 'get_status',
}

export enum SystemCommands {
  START = 'start',
}

export const USER_COMMANDS_CONFIG: BotCommand[] = [
  {
    command: UserCommands.CREATE_GAME,
    description: 'Create new game session',
  },
  {
    command: UserCommands.START_GAME,
    description: 'Start game process',
  },
  {
    command: UserCommands.GET_STATUS,
    description: 'Get current status',
  },
];
