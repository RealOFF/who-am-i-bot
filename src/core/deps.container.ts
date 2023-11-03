import { type Telegraf } from 'telegraf';
import { db } from './db.service';
import { logger } from './logger.service';
import { bot } from './bot.service';

export type DepsContainer = {
  logger: typeof logger;
  db: typeof db;
  bot: Telegraf;
};

export const depsContainer = {
  logger,
  db,
  bot,
};
