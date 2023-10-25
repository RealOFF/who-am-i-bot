import { type Message } from 'node-telegram-bot-api';
import type TelegramBot from 'node-telegram-bot-api';
import { Config } from '../../config';
import { BotCommands } from '../commands/bot-commands';
import {
  attendGame,
  createGame,
  createStartGame,
  createStartRound,
} from './game.service';
import { logger } from '../../core';
import { createGameSchema, attendGameSchema, startGameSchema } from './game.validator';

export function createCreateGameCommandHandler(bot: TelegramBot) {
  bot.onText(new RegExp(BotCommands.CREATE_GAME), async (message: Message) => {
    try {
      const { creatorId } = createGameSchema.parse({ creatorId: message.from?.id });
      const chatId = message.chat.id;

      const { password } = await createGame({ creatorId });

      bot.sendMessage(
        chatId,
        `Room created! Share this link with others: https://t.me/${Config.BOT_NAME}?start=${password}`
      );

      logger.info(`Link sent to user with id=${creatorId}`);
    } catch (error) {
      console.log('err', error);
      logger.error('Error in handler', {
        context: BotCommands.CREATE_GAME,
        error,
      });
    }
  });
}

export function createAttendGameCommandHandler(bot: TelegramBot) {
  bot.onText(
    new RegExp(BotCommands.ATTEND_GAME),
    (message: Message, match: RegExpExecArray | null) => {
      try {
        const { userId, gameCode } = attendGameSchema.parse({
          userId: message.from?.id,
          gameCode: match && match[1],
        });

        attendGame({
          userId,
          gameCode,
        });
      } catch (error) {
        logger.error('Error in handler', {
          context: BotCommands.ATTEND_GAME,
          error,
        });
      }
    }
  );
}

export function createStartGameCommandHandler(bot: TelegramBot) {
  const startRound = createStartRound({
    notifyUser: ({ userId }) => bot.sendMessage(userId, 'First round started'),
  });
  const startGame = createStartGame({ startRound });

  bot.onText(new RegExp(BotCommands.START_GAME), async (message: Message) => {
    try {
      const { userId } = startGameSchema.parse({ userId: message.from?.id });

      logger.info('Start to start game');
      await startGame({ userId });
    } catch (error) {
      logger.error('Error in handler', {
        context: BotCommands.START_GAME,
        error,
      });
    }
  });
}
