import { type Message } from 'node-telegram-bot-api';
import type TelegramBot from 'node-telegram-bot-api';
import { getCommands } from './bot-commands.service';
import { BotCommands } from './bot-commands.config';
import { startSchema } from './bot-commands.validator';
import { db, logger } from '../../../core';
import {
  createCreateGameCommandHandler,
  createAttendGameCommandHandler,
  createStartGameCommandHandler,
} from '../../game';

function createStartCommandHandler(bot: TelegramBot) {
  bot.onText(new RegExp(BotCommands.START), async (message: Message) => {
    try {
      const data = startSchema.parse({
        id: message.from?.id,
        username: message.from?.username,
        language: message.from?.language_code,
      });
      const chatId = message.chat.id;

      await db.user.create({ data });

      bot.sendMessage(chatId, 'Hello. Chat started.');
    } catch (error) {
      logger.error('Error in handler', {
        context: BotCommands.START,
        error,
      });
    }
  });
}

export function createBotCommandsController(bot: TelegramBot) {
  bot.setMyCommands(getCommands());

  createStartCommandHandler(bot);
  createCreateGameCommandHandler(bot);
  createAttendGameCommandHandler(bot);
  createStartGameCommandHandler(bot);
}
