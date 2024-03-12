import { Config } from '../../config';
import {
  createCreateGame,
  createStartGame,
  createStartRound,
  createSetupRole,
  createFinishRound,
  createPassStep,
} from './game.service';
import { type DepsContainer, UserCommands } from '../../core';
import {
  createGameSchema,
  startGameSchema,
  finishGameSchema,
  passStepSchema,
} from './game.validator';
import { GameErrors, RoundErrors } from './game.errors';
import { TextRequestType } from '../../domain';

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

const START_GAME_ERROR_HANDLERS = {
  [RoundErrors.FIRST_ROUND_ALREADY_CREATED]: 'First round already created.',
  [GameErrors.GAME_IS_NOT_FOUND]: 'Game with provided id is not found.',
  [GameErrors.NOT_ENOUGH_USERS_TO_START_GAME]:
    'Not enough users to start game. It should be minimum 2 users.',
  [GameErrors.PLAYER_HAVE_NO_START_GAME_ACCESS_RIGHTS]:
    'You have no start game access rights',
};

const isHasStartGameErrorHandler = (
  message: string
): message is keyof typeof START_GAME_ERROR_HANDLERS =>
  message in START_GAME_ERROR_HANDLERS;

export function createStartGameCommandHandler(depsContainer: DepsContainer) {
  const { bot, logger: baseLogger } = depsContainer;
  const logger = baseLogger.child({ context: 'createStartGameCommandHandler' });

  const startRound = createStartRound({
    ...depsContainer,
    notifyUserRoundStarted: ({ userId }) =>
      bot.telegram.sendMessage(userId, 'First round started.'),
    notifyUserNeedToCreateRole: ({ userId, roleName }) =>
      bot.telegram.sendMessage(
        userId,
        `Create a role for a user with a nickname: ${roleName}.`
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
      if (error instanceof Error && isHasStartGameErrorHandler(error.message)) {
        ctx.reply(START_GAME_ERROR_HANDLERS[error.message]);

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

export function createFinishRoundCommandHandler(depsContainer: DepsContainer) {
  const { bot, logger: baseLogger } = depsContainer;
  const logger = baseLogger.child({ context: 'createFinishRoundHandler' });
  const finishRound = createFinishRound({
    ...depsContainer,
    notifyUserRoundStarted: ({ userId, roundIndex }) =>
      bot.telegram.sendMessage(userId, `Round number ${roundIndex} started.`),
    notifyUserNeedToCreateRole: ({ userId, roleName }) =>
      bot.telegram.sendMessage(
        userId,
        `Create a role for a user with a nickname: ${roleName}.`
      ),
  });

  bot.command(UserCommands.FINISH_ROUND, async ctx => {
    try {
      const { userId } = finishGameSchema.parse({ userId: ctx.message.from?.id });

      await finishRound({ userId });
    } catch (error) {
      if (error instanceof Error && isHasStartGameErrorHandler(error.message)) {
        ctx.reply(START_GAME_ERROR_HANDLERS[error.message]);

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

export function createPassStepCommandHandler(depsContainer: DepsContainer) {
  const { bot, logger: baseLogger } = depsContainer;
  const logger = baseLogger.child({ context: 'createPassHandler' });
  const passStep = createPassStep({
    ...depsContainer,
  });

  bot.command(UserCommands.PASS_STEP, async ctx => {
    try {
      const { userId } = passStepSchema.parse({ userId: ctx.message.from?.id });

      await passStep({ userId });
    } catch (error) {
      if (error instanceof Error && isHasStartGameErrorHandler(error.message)) {
        ctx.reply(START_GAME_ERROR_HANDLERS[error.message]);

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

export function createSetupRoleHandler(depsContainer: DepsContainer) {
  const { bot, logger: baseLogger, db } = depsContainer;
  const logger = baseLogger.child({ context: 'createSetupRoleHandler' });
  const setupRole = createSetupRole(depsContainer);

  bot.hears(/.*/, async ctx => {
    logger.info(`Text message recieved: ${ctx.match.input}`);

    const user = await db.user.findUnique({ where: { id: ctx.message.from.id } });

    if (!user) {
      logger.error(`User with id=${ctx.message.from.id} is not found`);
      return;
    }
    if (user.activeTextRequestType === TextRequestType.SETUP_ROLE_NAME) {
      await setupRole({ assignedToId: user.id, title: ctx.message.text });
    }
  });
}
