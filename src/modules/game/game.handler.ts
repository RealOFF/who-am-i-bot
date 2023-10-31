import { Config } from '../../config';
import { createCreateGame, createStartGame, createStartRound } from './game.service';
import { type DepsContainer, UserCommands } from '../../core';
import { createGameSchema, startGameSchema } from './game.validator';
import { GameErrors } from './game.errors';

export function createCreateGameCommandHandler(depsContainer: DepsContainer) {
  const { bot, logger } = depsContainer;

  const createGame = createCreateGame(depsContainer);

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

export function createStartGameCommandHandler(depsContainer: DepsContainer) {
  const { bot, logger } = depsContainer;

  const startRound = createStartRound({
    ...depsContainer,
    notifyUser: ({ userId }) => bot.telegram.sendMessage(userId, 'First round started'),
  });
  const startGame = createStartGame({ ...depsContainer, startRound });

  bot.command(UserCommands.START_GAME, async ctx => {
    try {
      const { userId } = startGameSchema.parse({ userId: ctx.message.from?.id });

      logger.info('Start to start game');
      await startGame({ userId });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === GameErrors.PLAYER_HAVE_NO_START_GAME_ACCESS_RIGHTS
      ) {
        ctx.reply('You have no start game access rights');

        return;
      }
      logger.error('Error in handler', {
        context: UserCommands.START_GAME,
        error,
      });
    }
  });
}
