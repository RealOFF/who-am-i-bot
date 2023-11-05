import { Config } from '../../config';
import { createCreateGame, createStartGame, createStartRound } from './game.service';
import { type DepsContainer, UserCommands } from '../../core';
import { createGameSchema, startGameSchema } from './game.validator';
import { GameErrors } from './game.errors';

export function createCreateGameCommandHandler(depsContainer: DepsContainer) {
  const { bot, logger: baseLogger } = depsContainer;
  const logger = baseLogger.child({ context: 'createCreateGameCommandHandler' });

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
      logger.error(
        {
          error,
        },
        'Error in handler'
      );
    }
  });
}

export function createStartGameCommandHandler(depsContainer: DepsContainer) {
  const { bot, logger: baseLogger } = depsContainer;
  const logger = baseLogger.child({ context: 'createStartGameCommandHandler' });

  const startRound = createStartRound({
    ...depsContainer,
    notifyUserRoundStarted: ({ userId }) =>
      bot.telegram.sendMessage(userId, 'First round started'),
    notifyNotEnoughUsers: ({ userId }) =>
      bot.telegram.sendMessage(
        userId,
        'Not enough users to start game. It should be minimum 2 users.'
      ),
    notifyUserNeedToCreateRole: ({ userId, roleName }) =>
      bot.telegram.sendMessage(
        userId,
        `Create a role for a user with a nickname: ${roleName}`
      ),
  });
  const startGame = createStartGame({
    ...depsContainer,
    startRound,
  });

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
      logger.error(
        {
          error,
        },
        'Error in handler'
      );
    }
  });
}
