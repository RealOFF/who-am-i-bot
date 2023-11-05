import { Telegraf, session } from 'telegraf';
import { logger } from './logger.service';
import { Config } from '../config';

export function createBotInstance() {
  const bot = new Telegraf(Config.BOT_TOKEN);

  bot.use(async (ctx, next) => {
    logger.info(`Processing start updateId=${ctx.update.update_id}`);
    await next(); // runs next middleware
    // runs after next middleware finishes
    logger.info(`Processing end updateId=${ctx.update.update_id}`);
  });

  bot.use(session());

  bot.launch();

  logger.info('Bot started');

  return {
    bot,
    destroy: (message: string) => {
      bot.stop(message);
      logger.info('Bot has stopped');
    },
  };
}
