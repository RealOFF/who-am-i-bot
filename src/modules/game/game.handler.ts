import { Config } from '../../config';
import {
  attendGame,
  createGame,
  createStartGame,
  createStartRound,
} from './game.service';
import { type DepsContainer, UserCommands, SystemCommands } from '../../core';
import { createGameSchema, attendGameSchema, startGameSchema } from './game.validator';

export function createCreateGameCommandHandler({ bot, logger }: DepsContainer) {
  bot.command(UserCommands.CREATE_GAME, async ctx => {
    try {
      const { creatorId } = createGameSchema.parse({ creatorId: ctx.message.from?.id });

      const { password } = await createGame({ creatorId });

      ctx.reply(
        `Room created! Share this link with others: https://t.me/${Config.BOT_NAME}?start=${password}`
      );

      logger.info(`Link sent to user with id=${creatorId}`);
    } catch (error) {
      logger.error('Error in handler', {
        context: UserCommands.CREATE_GAME,
        error,
      });
    }
  });
}

export function createAttendGameCommandHandler({ bot, logger }: DepsContainer) {
  bot.command(SystemCommands.START, ctx => {
    try {
      console.log('ATTEND', ctx.payload);
      const { userId, gameCode } = attendGameSchema.parse({
        userId: ctx.message.from?.id,
        gameCode: '', //match && match[1],
      });

      attendGame({
        userId,
        gameCode,
      });
    } catch (error) {
      logger.error('Error in handler', {
        context: SystemCommands.ATTEND_GAME,
        error,
      });
    }
  });
}

export function createStartGameCommandHandler({ bot, logger }: DepsContainer) {
  const startRound = createStartRound({
    notifyUser: ({ userId }) => bot.telegram.sendMessage(userId, 'First round started'),
  });
  const startGame = createStartGame({ startRound });

  bot.command(UserCommands.START_GAME, async ctx => {
    try {
      const { userId } = startGameSchema.parse({ userId: ctx.message.from?.id });

      logger.info('Start to start game');
      await startGame({ userId });
    } catch (error) {
      logger.error('Error in handler', {
        context: UserCommands.START_GAME,
        error,
      });
    }
  });
}
