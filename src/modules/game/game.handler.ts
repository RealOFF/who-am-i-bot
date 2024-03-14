import {
  type CreateStartGameParams,
  createCreateGame,
  createStartGame,
} from './game.service';
import { type DepsContainer, UserCommands } from '../../core';
import { createGameSchema, startGameSchema } from './game.validator';
import { START_GAME_ERROR_MESSAGES, renderRoomCreated } from './game.view';

export function createCreateGameCommandHandler(depsContainer: DepsContainer) {
  const { bot, logger: baseLogger } = depsContainer;
  const logger = baseLogger.child({ context: 'createCreateGameCommandHandler' });

  const createGame = createCreateGame(depsContainer);

  bot.command(UserCommands.CREATE_GAME, async ctx => {
    const { creatorId } = createGameSchema.parse({ creatorId: ctx.message.from?.id });

    const {
      value: { password },
    } = await createGame({ creatorId });

    ctx.reply(renderRoomCreated(password));

    logger.info(`Link sent to user with id=${creatorId}`);
  });
}

type CreateStartGameCommandHandlerParams = CreateStartGameParams;

export function createStartGameCommandHandler(
  depsContainer: CreateStartGameCommandHandlerParams
) {
  const { bot, logger: baseLogger, startRound } = depsContainer;
  const logger = baseLogger.child({ context: 'createStartGameCommandHandler' });

  const startGame = createStartGame({
    ...depsContainer,
    startRound,
  });

  bot.command(UserCommands.START_GAME, async ctx => {
    const { userId } = startGameSchema.parse({ userId: ctx.message.from?.id });

    logger.info('Start to start game');
    const result = await startGame({ userId });

    if (result.isOk) {
      ctx.reply('Game started');
    } else {
      ctx.reply(START_GAME_ERROR_MESSAGES[result.error]);
    }
  });
}
