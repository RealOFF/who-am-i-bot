import { type DepsContainer } from '../../core';
import { GameErrors, RoundErrors } from './game.errors';
import { TextRequestType } from '../../domain';

type CreateGameParams = {
  creatorId: number;
};

export function createCreateGame({ logger: baseLogger, db }: DepsContainer) {
  const logger = baseLogger.child({ context: 'createCreateGame' });

  return async ({ creatorId }: CreateGameParams): Promise<{ password: string }> => {
    const session = await db.session.create({
      data: {
        players: {
          create: [
            {
              userId: creatorId,
              isCreator: true,
            },
          ],
        },
      },
    });
    logger.info('Session created');

    return session;
  };
}

type AttendGameParams = {
  userId: number;
  gameCode: string;
};

export function createAttendGame({ db, logger: baseLogger }: DepsContainer) {
  const logger = baseLogger.child({ context: 'createAttendGame' });

  return async ({ userId, gameCode }: AttendGameParams) => {
    const game = await db.session.findFirst({
      select: {
        id: true,
        players: { where: { userId } },
      },
      where: { password: gameCode },
    });

    if (!game) {
      logger.error(`Game not found game${gameCode}`);

      return;
    }

    if (game.players.length > 0) {
      logger.info(`Player with userId=${userId} already created in game=${gameCode}`);
      const [player] = game.players;

      await Promise.all([
        db.player.updateMany({
          where: {
            id: { not: player.id },
            userId,
          },
          data: { isActive: false },
        }),
        db.player.update({
          where: { id: player.id },
          data: { isActive: true },
        }),
      ]);

      return;
    }

    await db.player.create({
      data: {
        userId,
        sessionId: game.id,
        isCreator: false,
        isActive: true,
      },
    });
  };
}

type CreateStartGameParams = {
  startRound: (params: { gameId: number }) => Promise<unknown>;
} & DepsContainer;

type StartGameParams = {
  userId: number;
};

export function createStartGame({
  startRound,
  db,
  logger: baseLogger,
}: CreateStartGameParams) {
  const logger = baseLogger.child({ context: 'createStartGame' });

  return async ({ userId }: StartGameParams) => {
    const player = await db.player.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (!player) {
      logger.error(`Player with id=${userId} is not found`);

      return;
    }

    if (!player.isCreator) {
      logger.error(`Player with id=${userId} is not creator and can not start game`);

      throw new Error(GameErrors.PLAYER_HAVE_NO_START_GAME_ACCESS_RIGHTS);
    }

    await startRound({ gameId: player.sessionId });

    logger.info('Game started');
  };
}

type CreateStartRoundParams = {
  notifyUserRoundStarted: (params: {
    userId: number;
    roundIndex: number;
  }) => Promise<unknown>;
  notifyUserNeedToCreateRole: (params: {
    userId: number;
    roleName: string;
  }) => Promise<unknown>;
} & DepsContainer;

type StartRoundParams = {
  gameId: number;
  roundIndex?: number;
};

const MIN_PLAYERS = 2;

export function createStartRound(depsContainer: CreateStartRoundParams) {
  const {
    notifyUserRoundStarted,
    notifyUserNeedToCreateRole,
    db,
    logger: baseLogger,
  } = depsContainer;
  const createPlayersPairs = createCreatePlayersPairs(depsContainer);
  const logger = baseLogger.child({ context: 'createStartRound' });

  return async ({ gameId, roundIndex = 0 }: StartRoundParams) => {
    const game = await db.session.findUnique({
      where: { id: gameId },
      include: {
        players: { include: { user: true } },
        rounds: true,
      },
    });

    if (game && game.rounds.length > 0) {
      logger.warn('First round already created');

      throw new Error(RoundErrors.FIRST_ROUND_ALREADY_CREATED);
    }

    if (!game) {
      logger.error(`Game with id=${gameId} is not found`);

      throw new Error(GameErrors.GAME_IS_NOT_FOUND);
    }

    const playersOrder = createPlayersQueue(game.players);
    const round = await db.round.create({
      data: { sessionId: gameId, activeRoleId: playersOrder[0].id },
    });
    logger.info(`Round created. Id=${round.id}`);

    if (game.players.length < MIN_PLAYERS) {
      logger.warn('Not enough users to start game');

      if (game.players.length === 1) {
        throw new Error(GameErrors.NOT_ENOUGH_USERS_TO_START_GAME);
      }
    }

    await Promise.all(
      game.players.map(({ userId }) => notifyUserRoundStarted({ userId, roundIndex }))
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

      return;
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
  };
}

type Pair<T> = {
  from: T;
  to: T;
};

function createRandomPairs<T>(array: T[]) {
  let toArray = array;

  return array.reduce<Pair<T>[]>((result, item) => {
    const preparedToArray = toArray.filter(el => el !== item);
    const randomIndex = Math.floor(Math.random() * preparedToArray.length);

    result.push({
      from: item,
      to: preparedToArray[randomIndex],
    });

    toArray = toArray.filter(item => item !== preparedToArray[randomIndex]);

    return result;
  }, []);
}

type CreatePlayersPairsParams<T> = {
  players: T[];
};

function createCreatePlayersPairs({ logger: baseLogger }: DepsContainer) {
  const logger = baseLogger.child({ context: 'createCreatePlayersPairs' });

  return <T>({ players }: CreatePlayersPairsParams<T>) => {
    const randomPairs = createRandomPairs(players);

    logger.info({ pairs: randomPairs }, 'Pairs created');

    return randomPairs;
  };
}

type CreateSetupRole = {
  assignedToId: number;
  title: string;
};

export function createSetupRole({ db }: DepsContainer) {
  return ({ assignedToId, title }: CreateSetupRole) => {
    return db.role.update({
      where: {
        assignedToId,
      },
      data: {
        title,
      },
    });
  };
}

type CreateFinishRound = {
  userId: number;
};

export function createFinishRound(depsContainer: CreateStartRoundParams) {
  const { db, logger: baseLogger } = depsContainer;
  const logger = baseLogger.child({ context: 'createCreatePlayersPairs' });
  const startRound = createStartRound(depsContainer);

  return async ({ userId }: CreateFinishRound) => {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        players: {
          where: { isActive: true, isCreator: true },
          include: {
            session: {
              include: {
                rounds: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      logger.error(`User with sepcified id=${userId} is not found`);

      throw new Error(GameErrors.USER_IS_NOT_FOUND);
    }

    const [player] = user.players;

    if (!player) {
      logger.warn(`User with id=${userId} have no creator access`);

      throw new Error(RoundErrors.PLAYER_HAVE_NO_FINISH_ROUND_ACCESS_RIGHTS);
    }

    const { rounds } = player.session;

    await db.round.update({
      where: {
        id: rounds[rounds.length - 1].id,
      },
      data: {
        isActive: false,
      },
    });

    await startRound({
      gameId: player.session.id,
      roundIndex: player.session.rounds.length + 1,
    });
  };
}

function createPlayersQueue<T>(array: T[]) {
  return [...array].sort(() => {
    const value = Math.random();

    switch (true) {
      case value > 0.5:
        return 1;
      case value < 0.5:
        return -1;
      default:
        return 0;
    }
  });
}

type PassStepParams = {
  userId: number;
};

export function createPassStep(depsContainer: DepsContainer) {
  const { db, logger: baseLogger } = depsContainer;
  const logger = baseLogger.child({ context: 'createPassStep' });

  return async ({ userId }: PassStepParams) => {
    const round = await db.round.findFirst({
      where: {
        isActive: true,
        activeRole: {
          assignedTo: {
            userId,
          },
        },
      },
      include: {
        activeRole: true,
        roles: true,
      },
    });

    if (!round) {
      logger.error('Round is not found', { userId });

      return new Error(RoundErrors.ROUND_IS_NOT_FOUND);
    }
    const { activeRole } = round;

    if (activeRole === null) {
      logger.error('Current round have no active role', { roundId: round.id });

      return new Error(RoundErrors.CURRECT_ROUND_HAVE_NO_ACTIVE_ROLE);
    }

    const nextRoleInCurrentCycle = round.roles.find(
      ({ order }) => activeRole.order + 1 === order
    );
    const nextRole = nextRoleInCurrentCycle || round.roles[0];

    return db.round.update({
      where: {
        id: round.id,
      },
      data: {
        activeRoleId: nextRole.id,
      },
    });
  };
}
