import { type Telegraf } from 'telegraf';
import { db } from './db.service';
import { logger, type Logger } from './logger.service';
import { createBotInstance } from './bot.service';

export type DepsContainer = {
  logger: Logger;
  db: typeof db;
  bot: Telegraf;
};

function createDepsContainer() {
  const { bot, destroy } = createBotInstance();
  const depsContainer = {
    logger,
    db,
    bot,
  };

  return {
    depsContainer,
    depsCleanup(message: string) {
      destroy(message);
    },
  };
}

export const { depsContainer, depsCleanup } = createDepsContainer();
