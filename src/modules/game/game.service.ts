import { type DepsContainer } from '../../core';
import { GameErrors } from './game.errors';

type CreateGameParams = {
  creatorId: number;
};

export function createCreateGame({ logger, db }: DepsContainer) {
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

export function createAttendGame({ db, logger }: DepsContainer) {
  return async ({ userId, gameCode }: AttendGameParams) => {
    const game = await db.session.findFirst({
      select: {
        id: true,
        players: {
          where: { userId },
        },
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
            id: {
              not: player.id,
            },
            userId,
          },
          data: {
            isActive: false,
          },
        }),
        db.player.update({
          where: { id: player.id },
          data: {
            isActive: true,
          },
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

export function createStartGame({ startRound, db, logger }: CreateStartGameParams) {
  return async ({ userId }: StartGameParams) => {
    const player = await db.player.findFirst({ where: { userId, isActive: true } });

    if (!player) {
      logger.error(`Player with id=${userId} is not found`);

      return;
    }

    if (!player.isCreator) {
      logger.error(`Player with id=${userId} is not creator and can not start game`, {
        context: 'startGame',
      });

      throw new Error(GameErrors.PLAYER_HAVE_NO_START_GAME_ACCESS_RIGHTS);
    }

    await startRound({ gameId: player.sessionId });

    logger.info('Game started');
  };
}

type CreateStartRoundParams = {
  notifyUser: (params: { userId: number }) => Promise<unknown>;
} & DepsContainer;

type StartRoundParams = {
  gameId: number;
};

export function createStartRound({ notifyUser, db, logger }: CreateStartRoundParams) {
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
