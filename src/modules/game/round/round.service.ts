import { type DepsContainer } from '../../../core';
import { TextRequestType } from '../../../domain';
import { createCreatePlayersPairs, createPlayersQueue } from '../player';
import {
  createOkResult,
  createErrResult,
  createEmptyOkResult,
  type Result,
} from '../../../common';

export type CreateStartRoundParams = {
  notifyUserRoundStarted: (params: {
    userId: number;
    roundIndex: number;
  }) => Promise<unknown>;
  notifyUserNeedToCreateRole: (params: {
    userId: number;
    roleName: string;
  }) => Promise<unknown>;
} & DepsContainer;

export type StartRoundParams = {
  gameId: number;
  roundIndex?: number;
};

const MIN_PLAYERS = 2;

export enum StartRoundErrors {
  NOT_ENOUGH_USERS_TO_START_GAME = 'NOT_ENOUGH_USERS_TO_START_GAME',
  GAME_IS_NOT_FOUND = 'GAME_IS_NOT_FOUND',
  FIRST_ROUND_ALREADY_CREATED = 'FIRST_ROUND_ALREADY_CREATED',
  ACTIVE_ROUND_IS_NOT_FOUND = 'ACTIVE_ROUND_IS_NOT_FOUND',
}

export function createStartRound(depsContainer: CreateStartRoundParams) {
  const {
    notifyUserRoundStarted,
    notifyUserNeedToCreateRole,
    db,
    logger: baseLogger,
  } = depsContainer;
  const createPlayersPairs = createCreatePlayersPairs(depsContainer);
  const logger = baseLogger.child({ context: 'createStartRound' });

  return async ({
    gameId,
    roundIndex = 0,
  }: StartRoundParams): Promise<Result<void, StartRoundErrors>> => {
    const game = await db.session.findUnique({
      where: { id: gameId },
      include: {
        players: { include: { user: true } },
        rounds: true,
      },
    });

    if (!game) {
      logger.error(`Game with id=${gameId} is not found`);

      return createErrResult(StartRoundErrors.GAME_IS_NOT_FOUND);
    }

    if (game && game.rounds.length > 0) {
      logger.warn('First round already created');

      return createErrResult(StartRoundErrors.FIRST_ROUND_ALREADY_CREATED);
    }

    const playersOrder = createPlayersQueue(game.players);
    const round = await db.round.create({
      data: {
        sessionId: gameId,
        activeRoleId: playersOrder[0].id,
      },
    });
    logger.info(`Round created. Id=${round.id}`);

    if (game.players.length < MIN_PLAYERS) {
      logger.warn('Not enough users to start game');

      if (game.players.length === 1) {
        return createErrResult(StartRoundErrors.NOT_ENOUGH_USERS_TO_START_GAME);
      }
    }

    await Promise.all(
      game.players.map(({ userId }) =>
        notifyUserRoundStarted({
          userId,
          roundIndex,
        })
      )
    );

    const playersPairs = createPlayersPairs({ players: game.players });

    await db.user.updateMany({
      data: { activeTextRequestType: TextRequestType.SETUP_ROLE_NAME },
    });
    const activeRound = await db.round.findFirst({
      where: {
        sessionId: gameId,
        isActive: true,
      },
    });

    if (!activeRound) {
      logger.error(`Active round with gameId=${gameId} is not found.`);

      return createErrResult(StartRoundErrors.ACTIVE_ROUND_IS_NOT_FOUND);
    }

    await db.role.createMany({
      data: playersPairs.map(({ from, to }) => ({
        title: '',
        roundId: activeRound.id,
        assignedToId: to.id,
        createdById: from.id,
        // Optimise order random
        order: playersOrder.findIndex(({ id }) => id === to.id),
      })),
    });

    playersPairs.forEach(({ from, to }) =>
      notifyUserNeedToCreateRole({
        userId: from.userId,
        roleName: to.user.username,
      })
    );

    return createEmptyOkResult();
  };
}

export type CreateFinishRoundParams = {
  startRound: ({
    gameId,
    roundIndex,
  }: StartRoundParams) => Promise<Result<void, StartRoundErrors>>;
} & DepsContainer;

export type CreateFinishRound = {
  userId: number;
};

export enum FinishRoundErrors {
  USER_IS_NOT_FOUND_TO_FINISH_ROUND = 'USER_IS_NOT_FOUND_TO_FINISH_ROUND',
  PLAYER_HAVE_NO_FINISH_ROUND_ACCESS_RIGHTS = 'PLAYER_HAVE_NO_FINISH_ROUND_ACCESS_RIGHTS',
}

export function createFinishRound(depsContainer: CreateFinishRoundParams) {
  const { db, logger: baseLogger, startRound } = depsContainer;
  const logger = baseLogger.child({ context: 'createFinishRound' });

  return async ({
    userId,
  }: CreateFinishRound): Promise<Result<void, FinishRoundErrors | StartRoundErrors>> => {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        players: {
          where: {
            isActive: true,
            isCreator: true,
          },
          include: { session: { include: { rounds: true } } },
        },
      },
    });

    if (!user) {
      logger.error(`User with sepcified id=${userId} is not found`);

      return createErrResult(FinishRoundErrors.USER_IS_NOT_FOUND_TO_FINISH_ROUND);
    }

    const [player] = user.players;

    if (!player) {
      logger.warn(`User with id=${userId} have no creator access`);

      return createErrResult(FinishRoundErrors.PLAYER_HAVE_NO_FINISH_ROUND_ACCESS_RIGHTS);
    }

    const { rounds } = player.session;

    await db.round.update({
      where: { id: rounds[rounds.length - 1].id },
      data: { isActive: false },
    });

    return startRound({
      gameId: player.session.id,
      roundIndex: player.session.rounds.length + 1,
    });
  };
}

export type CreateSetupRole = {
  assignedToId: number;
  title: string;
};

export function createSetupRole({ db }: DepsContainer) {
  return async ({ assignedToId, title }: CreateSetupRole) => {
    const result = await db.role.update({
      where: { assignedToId },
      data: { title },
    });
    return createOkResult(result);
  };
}
