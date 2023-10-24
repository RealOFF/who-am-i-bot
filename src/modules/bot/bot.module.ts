import { createBotController } from './bot.controller';

export const botModule = {
  init() {
    return createBotController();
  },
};
