import { db, logger } from '../../core';

type CreateGameParams = {
  creatorId: number;
};

export async function createGame({
  creatorId,
}: CreateGameParams): Promise<{ password: string }> {
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
}

type AttendGameParams = {
  userId: number;
  gameCode: string;
};

export async function attendGame({ userId, gameCode }: AttendGameParams) {
  const game = await db.session.findFirst({
    select: {
      id: true,
      players: true,
    },
    where: { password: gameCode },
  });

  if (!game) {
    logger.error(`Game with code=${gameCode} is not found`, { context: 'attendGame' });

    return;
  }

  if (game.players.some(player => player.userId === userId)) {
    return;
  }

  await db.player.create({
    data: {
      userId,
      sessionId: game.id,
      isCreator: false,
    },
  });
}

type CreateStartGameParams = {
  startRound: (params: { gameId: number }) => Promise<unknown>;
};

type StartGameParams = {
  userId: number;
};

export function createStartGame({ startRound }: CreateStartGameParams) {
  return async ({ userId }: StartGameParams) => {
    const player = await db.player.findFirst({ where: { userId } });

    if (!player) {
      logger.error(`Player with id=${userId} is not found`);

      return;
    }

    if (!player.isCreator) {
      logger.error(`Player with id=${userId} is not creator and can not start game`, {
        context: 'startGame',
      });

      return;
    }

    await startRound({ gameId: player.sessionId });

    logger.info('Game started');
  };
}

type CreateStartRoundParams = {
  notifyUser: (params: { userId: number }) => Promise<unknown>;
};

type StartRoundParams = {
  gameId: number;
};

export function createStartRound({ notifyUser }: CreateStartRoundParams) {
  return async ({ gameId }: StartRoundParams) => {
    const round = await db.round.create({ data: { sessionId: gameId } });
    logger.info(`Round created. Id=${round.id}`);
    const game = await db.session.findUnique({
      where: { id: gameId },
      include: { players: true },
    });

    if (!game) {
      logger.error(`Game with id=${gameId} is not found`, { context: 'startRound' });

      return;
    }

    await Promise.all(game.players.map(({ userId }) => notifyUser({ userId })));
  };
}
