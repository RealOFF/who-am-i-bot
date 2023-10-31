import { Telegraf } from 'telegraf';
import { logger } from '../../core';
import { Config } from '../../config';
import { createBotCommandsController } from '../commands/bot-commands';

export function createBotController() {
  const bot = new Telegraf(Config.BOT_TOKEN);

  bot.use(async (ctx, next) => {
    logger.info(`Processing start updateId=${ctx.update.update_id}`);
    await next(); // runs next middleware
    // runs after next middleware finishes
    logger.info(`Processing end updateId=${ctx.update.update_id}`);
  });

  createBotCommandsController(bot);

  bot.launch();

  logger.info('Bot started');

  return (message: string) => {
    bot.stop(message);
    logger.info('Bot has stopped.');
  };
}
