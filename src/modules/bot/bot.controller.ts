import TelegramBot from 'node-telegram-bot-api';
import { logger } from 'core';
import { Config } from 'config';

export function createBotController() {
  const bot = new TelegramBot(Config.BOT_TOKEN, { polling: true });

  bot.on('message', message => {
    logger.info('Message recived', message);
    const chatId = message.chat.id;
    const messageText = message.text;

    bot.sendMessage(chatId, `You said: ${messageText}`);
  });

  bot.on('polling_error', error => {
    logger.error(error);
  });

  return () => {
    bot.stopPolling();
    logger.info('Bot has stopped.');
  };
}
