import { type Telegraf } from 'telegraf';
import { getCommands } from './bot-commands.service';
import { BotCommands } from './bot-commands.config';
import { startSchema } from './bot-commands.validator';
import { db, logger } from '../../../core';
import {
  createCreateGameCommandHandler,
  createAttendGameCommandHandler,
  createStartGameCommandHandler,
} from '../../game';

function createStartCommandHandler(bot: Telegraf) {
  bot.command(BotCommands.START, async ctx => {
    try {
      const data = startSchema.parse({
        id: ctx.message.from?.id,
        username: ctx.message.from?.username,
        language: ctx.message.from?.language_code,
      });

      await db.user.create({ data });
      ctx.reply('Hello. Chat started.');
    } catch (error) {
      logger.error('Error in handler', {
        context: BotCommands.START,
        error,
      });
    }
  });
}

export function createBotCommandsController(bot: Telegraf) {
  bot.telegram.setMyCommands(getCommands());

  createStartCommandHandler(bot);
  createCreateGameCommandHandler(bot);
  createAttendGameCommandHandler(bot);
  createStartGameCommandHandler(bot);
}
