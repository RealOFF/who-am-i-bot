import { type DepsContainer } from '../../core';
import { GameErrors } from './game.errors';
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
  notifyUserRoundStarted: (params: { userId: number }) => Promise<unknown>;
  notifyUserNeedToCreateRole: (params: {
    userId: number;
    roleName: string;
  }) => Promise<unknown>;
} & DepsContainer;

type StartRoundParams = {
  gameId: number;
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

  return async ({ gameId }: StartRoundParams) => {
    const game = await db.session.findUnique({
      where: { id: gameId },
      include: {
        players: { include: { user: true } },
        rounds: true,
      },
    });

    if (game && game.rounds.length > 0) {
      logger.warn('First round already created');

      throw new Error(GameErrors.FIRST_ROUND_ALREADY_CREATED);
    }

    const round = await db.round.create({ data: { sessionId: gameId } });
    logger.info(`Round created. Id=${round.id}`);

    if (!game) {
      logger.error(`Game with id=${gameId} is not found`);

      throw new Error(GameErrors.GAME_IS_NOT_FOUND);
    }

    if (game.players.length < MIN_PLAYERS) {
      logger.warn('Not enough users to start game');

      if (game.players.length === 1) {
        throw new Error(GameErrors.NOT_ENOUGH_USERS_TO_START_GAME);
      }
    }

    await Promise.all(
      game.players.map(({ userId }) => notifyUserRoundStarted({ userId }))
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
