import TelegramBot from 'node-telegram-bot-api';
import { logger } from '../../core';
import { Config } from '../../config';
import { createBotCommandsController } from '../commands/bot-commands';

export function createBotController() {
  const bot = new TelegramBot(Config.BOT_TOKEN, { polling: true });

  bot.on('message', message => {
    logger.info('Message recived', message);
  });

  bot.on('polling_error', error => {
    logger.error(error);
  });

  createBotCommandsController(bot);

  return () => {
    bot.stopPolling();
    logger.info('Bot has stopped.');
  };
}
