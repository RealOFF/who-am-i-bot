import { type DepsContainer } from '../../../core';
import { TextRequestType } from '../../../domain';
import { createCreatePlayersPairs } from '../player';
import {
  createOkResult,
  createErrResult,
  createEmptyOkResult,
  type Result,
  orderByRandom,
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
  NOT_ENOUGH_USERS_TO_START_ROUND = 'NOT_ENOUGH_USERS_TO_START_GAME',
  GAME_IS_NOT_FOUND = 'GAME_IS_NOT_FOUND',
  FIRST_ROUND_ALREADY_CREATED = 'FIRST_ROUND_ALREADY_CREATED',
  ACTIVE_ROUND_IS_NOT_FOUND = 'ACTIVE_ROUND_IS_NOT_FOUND',
  ROLE_IS_NOT_FOUND = 'ROLE_IS_NOT_FOUND',
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

    const round = await db.round.create({
      data: {
        sessionId: gameId,
      },
    });
    logger.info(`Round created. Id=${round.id}`);

    if (game.players.length < MIN_PLAYERS) {
      logger.warn('Not enough users to start game');

      if (game.players.length === 1) {
        return createErrResult(StartRoundErrors.NOT_ENOUGH_USERS_TO_START_ROUND);
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

    const roles = playersPairs.map(({ from, to }) => ({
      title: '',
      roundId: round.id,
      assignedToId: to.id,
      createdById: from.id,
    }));
    const orderedRoles = orderByRandom(roles);
    const rolesWithOrder = orderedRoles.map((role, index) => ({ ...role, order: index }));

    await db.role.createMany({
      data: rolesWithOrder,
    });
    const activeRole = await db.role.findFirst({
      where: { order: 0 },
    });

    if (activeRole === null) {
      logger.error('Role is not found');

      return createErrResult(StartRoundErrors.ROLE_IS_NOT_FOUND);
    }

    await db.round.update({
      where: {
        id: round.id,
      },
      data: {
        activeRoleId: activeRole.id,
      },
    });

    await db.user.updateMany({
      data: { activeTextRequestType: TextRequestType.SETUP_ROLE_NAME },
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
